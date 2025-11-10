/**
 * Centralized API service
 * Provides consistent API calls with error handling and logging
 * Now uses IP-based persistent sessions for simplified session management
 */

import { API_CONFIG, ERROR_MESSAGES, isRailway, RAILWAY_TIMEOUTS } from '../config/constants';
import { log } from './logger';

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

interface TsdateInferenceRequest {
  filename: string;
  mutation_rate: number;
  preprocess: boolean;
  remove_telomeres: boolean;
  minimum_gap?: number;
  split_disjoint: boolean;
  filter_populations: boolean;
  filter_individuals: boolean;
  filter_sites: boolean;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  error?: string;
  components?: {
    session_storage: 'ok' | string;
    numpy: 'ok' | string;
    tskit: 'ok' | string;
    fastgaia: 'ok' | 'not available';
    gaia: 'ok' | 'not available';
    gaiapy: 'ok' | 'not available';
  };
  environment?: {
    max_session_age_hours: string | null;
    max_files_per_session: string | null;
    max_file_size_mb: string | null;
  };
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs?: number
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';

    log.api.call(endpoint, method, options.body);

    // Add retries for initial connection
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    let lastError: Error | null = null;
    
    // Determine timeout: use provided timeout, or Railway default if on Railway, or no timeout locally
    // For local installations, we want to use maximum resources and avoid timeouts
    let timeout: number | undefined;
    if (timeoutMs !== undefined) {
      timeout = timeoutMs;
    } else if (isRailway()) {
      // On Railway, use a default timeout to prevent hanging requests
      timeout = 60000; // 60 seconds default for Railway
    }
    // On local, timeout is undefined = no timeout (browser/fetch default behavior)

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add timeout only if specified (Railway or explicitly provided)
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;
        if (timeout !== undefined) {
          timeoutId = setTimeout(() => controller.abort(), timeout);
        }

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: timeout !== undefined ? controller.signal : undefined,
        });

        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        // Safely parse response as JSON if possible, else fallback to text
        const contentType = response.headers.get('content-type') || '';
        let data: any = null;
        let rawText: string | null = null;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Fallback to text and try JSON parse just in case
          rawText = await response.text();
          try {
            data = JSON.parse(rawText);
          } catch {
            data = null;
          }
        }

        if (!response.ok) {
          const errorDetail = (data && (data.detail || data.message)) || rawText || `HTTP error! status: ${response.status}`;
          const error = new Error(errorDetail);
          
          // Don't retry client errors (4xx) - these are not transient failures
          // Only retry server errors (5xx) and network errors
          // Throw immediately for client errors to prevent retries
          if (response.status >= 400 && response.status < 500) {
            log.api.error(endpoint, error, method);
            throw error; // This will exit the try block and skip retry logic
          }
          
          // For server errors, continue to retry logic below
          throw error;
        }

        log.api.success(endpoint, method, data ?? rawText);
        return { data: (data ?? (rawText as any)), status: response.status };
      } catch (error) {
        // If this is already an Error object with a message from our error handling above, use it
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            const timeoutSeconds = timeout !== undefined ? timeout / 1000 : 'unknown';
            const timeoutError = new Error(`Request timed out after ${timeoutSeconds} seconds`);
            log.api.error(endpoint, timeoutError, method);
            throw timeoutError;
          }
        }
        
        // Check if this is a client error (4xx) - don't retry these
        // We check the error message since we don't have access to response.status here
        const isClientError = lastError.message.includes('400') || 
                              lastError.message.includes('401') || 
                              lastError.message.includes('403') || 
                              lastError.message.includes('404') ||
                              lastError.message.includes('Bad Request') ||
                              lastError.message.includes('Railway limit'); // Railway limit errors are 400
        
        if (isClientError) {
          log.api.error(endpoint, lastError, method);
          throw lastError; // Don't retry client errors
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          log.api.error(endpoint, lastError, method);
          throw lastError;
        }
        
        // Only retry for network errors or server errors (5xx)
        // Wait and retry (only for server errors or network issues)
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // This should never be reached due to the throw in the loop
    throw new Error('Unexpected error in request retry loop');
  }

  private async uploadFile(endpoint: string, file: File): Promise<ApiResponse> {
    const url = `${this.baseURL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    log.api.call(endpoint, 'POST', { filename: file.name, size: file.size });
    console.log(`[API] Starting upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      const uploadStartTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const uploadTime = Date.now() - uploadStartTime;
      console.log(`[API] Upload request completed in ${uploadTime}ms, status: ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      let rawText: string | null = null;

      console.log(`[API] Parsing response, content-type: ${contentType}`);
      const parseStartTime = Date.now();
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }
      }

      const parseTime = Date.now() - parseStartTime;
      console.log(`[API] Response parsed in ${parseTime}ms`);

      if (!response.ok) {
        const errorDetail = (data && (data.detail || data.message)) || rawText || ERROR_MESSAGES.UPLOAD_FAILED;
        console.error(`[API] Upload failed with status ${response.status}:`, errorDetail);
        throw new Error(errorDetail);
      }

      console.log(`[API] Upload successful, response data:`, data);
      log.api.success(endpoint, 'POST', data ?? rawText);
      return { data: (data ?? (rawText as any)), status: response.status };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.UPLOAD_FAILED;
      console.error(`[API] Upload error for ${file.name}:`, error);
      log.api.error(endpoint, new Error(errorMsg), 'POST');
      throw error;
    }
  }

  // Tree sequence operations - now using simplified endpoints
  async uploadTreeSequence(file: File) {
    return this.uploadFile(API_CONFIG.ENDPOINTS.UPLOAD, file);
  }

  async getUploadedFiles() {
    return this.request(API_CONFIG.ENDPOINTS.UPLOADED_FILES);
  }

  async getTreeSequenceMetadata(filename: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.TREE_SEQUENCE_METADATA}/${encodeURIComponent(filename)}`);
  }

  async deleteTreeSequence(filename: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.DELETE_TREE_SEQUENCE}/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  }

  async downloadTreeSequence(filename: string, format: 'trees' | 'tsz' = 'trees'): Promise<Blob> {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE}/${encodeURIComponent(filename)}?format=${format}`;
    
    log.api.call(API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE, 'GET', { filename, format });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
      }
      
      const blob = await response.blob();
      log.api.success(API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE, 'GET', { size: blob.size, format });
      
      return blob;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.DOWNLOAD_FAILED;
      log.api.error(API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE, new Error(errorMsg), 'GET');
      throw error;
    }
  }

  async downloadLocationsCSV(
    filename: string,
    options: {
      nodeType?: 'all' | 'samples' | 'internal';
      includeColumns?: string[];
    } = {}
  ): Promise<Blob> {
    const { nodeType = 'all', includeColumns = [] } = options;
    const params = new URLSearchParams();
    params.append('node_type', nodeType);
    if (includeColumns.length > 0) {
      params.append('include_columns', includeColumns.join(','));
    }
    
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.DOWNLOAD_LOCATIONS_CSV}/${encodeURIComponent(filename)}?${params.toString()}`;
    
    log.api.call(API_CONFIG.ENDPOINTS.DOWNLOAD_LOCATIONS_CSV, 'GET', { filename, nodeType, includeColumns });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
      }
      
      const blob = await response.blob();
      log.api.success(API_CONFIG.ENDPOINTS.DOWNLOAD_LOCATIONS_CSV, 'GET', { size: blob.size, nodeType });
      
      return blob;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.DOWNLOAD_FAILED;
      log.api.error(API_CONFIG.ENDPOINTS.DOWNLOAD_LOCATIONS_CSV, new Error(errorMsg), 'GET');
      throw error;
    }
  }

  async downloadStatisticsCSV(filename: string): Promise<Blob> {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.DOWNLOAD_STATISTICS_CSV}/${encodeURIComponent(filename)}`;
    
    log.api.call(API_CONFIG.ENDPOINTS.DOWNLOAD_STATISTICS_CSV, 'GET', { filename });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
      }
      
      const blob = await response.blob();
      log.api.success(API_CONFIG.ENDPOINTS.DOWNLOAD_STATISTICS_CSV, 'GET', { size: blob.size, filename });
      
      return blob;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.DOWNLOAD_FAILED;
      log.api.error(API_CONFIG.ENDPOINTS.DOWNLOAD_STATISTICS_CSV, new Error(errorMsg), 'GET');
      throw error;
    }
  }

  async downloadDiffStatistics(
    firstFilename: string,
    secondFilename: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('second_filename', secondFilename);
    params.append('format', format);
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.DOWNLOAD_DIFF_STATISTICS}/${encodeURIComponent(firstFilename)}?${params.toString()}`;
    
    log.api.call(API_CONFIG.ENDPOINTS.DOWNLOAD_DIFF_STATISTICS, 'GET', { firstFilename, secondFilename, format });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
      }
      
      const blob = await response.blob();
      log.api.success(API_CONFIG.ENDPOINTS.DOWNLOAD_DIFF_STATISTICS, 'GET', { size: blob.size, firstFilename, secondFilename, format });
      
      return blob;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.DOWNLOAD_FAILED;
      log.api.error(API_CONFIG.ENDPOINTS.DOWNLOAD_DIFF_STATISTICS, new Error(errorMsg), 'GET');
      throw error;
    }
  }

  async downloadIntermediateData(
    filename: string,
    dataType: string,
    format?: 'pkl' | 'csv' | 'npy' | 'zip'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('data_type', dataType);
    if (format) {
      params.append('format', format);
    }
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.DOWNLOAD_INTERMEDIATE_DATA}/${encodeURIComponent(filename)}?${params.toString()}`;
    
    log.api.call(API_CONFIG.ENDPOINTS.DOWNLOAD_INTERMEDIATE_DATA, 'GET', { filename, dataType, format });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
      }
      
      const blob = await response.blob();
      log.api.success(API_CONFIG.ENDPOINTS.DOWNLOAD_INTERMEDIATE_DATA, 'GET', { size: blob.size, dataType, format });
      
      return blob;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.DOWNLOAD_FAILED;
      log.api.error(API_CONFIG.ENDPOINTS.DOWNLOAD_INTERMEDIATE_DATA, new Error(errorMsg), 'GET');
      throw error;
    }
  }

  async listIntermediateData(filename: string): Promise<{ available_data_types: string[] }> {
    const response = await this.request<{ available_data_types: string[] }>(
      `${API_CONFIG.ENDPOINTS.LIST_INTERMEDIATE_DATA}/${encodeURIComponent(filename)}`
    );
    return response.data;
  }

  // Data retrieval - simplified endpoint
  async getGraphData(
    filename: string,
    options: {
      maxSamples?: number;
      genomicStart?: number;
      genomicEnd?: number;
      treeStartIdx?: number;
      treeEndIdx?: number;
      temporalStart?: number;
      temporalEnd?: number;
      sampleOrder?: string;
    } = {}
  ) {
    const params = new URLSearchParams();
    if (options.maxSamples) params.append('max_samples', options.maxSamples.toString());
    if (options.genomicStart !== undefined) params.append('genomic_start', options.genomicStart.toString());
    if (options.genomicEnd !== undefined) params.append('genomic_end', options.genomicEnd.toString());
    if (options.treeStartIdx !== undefined) params.append('tree_start_idx', options.treeStartIdx.toString());
    if (options.treeEndIdx !== undefined) params.append('tree_end_idx', options.treeEndIdx.toString());
    if (options.temporalStart !== undefined) params.append('temporal_start', options.temporalStart.toString());
    if (options.temporalEnd !== undefined) params.append('temporal_end', options.temporalEnd.toString());
    if (options.sampleOrder) params.append('sample_order', options.sampleOrder);
    
    const endpoint = `${API_CONFIG.ENDPOINTS.GRAPH_DATA}/${encodeURIComponent(filename)}?${params}`;
    return this.request(endpoint);
  }

  // Statistics endpoints
  async getStatisticsForRange(
    filename: string,
    options: {
      genomicStart?: number;
      genomicEnd?: number;
      temporalStart?: number;
      temporalEnd?: number;
      treeStartIdx?: number;
      treeEndIdx?: number;
      mutationRate?: number;
    } = {}
  ) {
    const params = new URLSearchParams();
    if (options.genomicStart !== undefined) params.append('genomic_start', options.genomicStart.toString());
    if (options.genomicEnd !== undefined) params.append('genomic_end', options.genomicEnd.toString());
    if (options.temporalStart !== undefined) params.append('temporal_start', options.temporalStart.toString());
    if (options.temporalEnd !== undefined) params.append('temporal_end', options.temporalEnd.toString());
    if (options.treeStartIdx !== undefined) params.append('tree_start_idx', options.treeStartIdx.toString());
    if (options.treeEndIdx !== undefined) params.append('tree_end_idx', options.treeEndIdx.toString());
    if (options.mutationRate !== undefined) params.append('mutation_rate', options.mutationRate.toString());
    
    const endpoint = `/statistics/range/${encodeURIComponent(filename)}?${params}`;
    return this.request(endpoint);
  }

  async getWindowedStatistics(
    filename: string,
    options: {
      windowSize: number;
      windowStep?: number;
      mutationRate?: number;
    }
  ) {
    const params = new URLSearchParams();
    params.append('window_size', options.windowSize.toString());
    if (options.windowStep !== undefined) params.append('window_step', options.windowStep.toString());
    if (options.mutationRate !== undefined) params.append('mutation_rate', options.mutationRate.toString());
    
    const endpoint = `/statistics/windowed/${encodeURIComponent(filename)}?${params}`;
    return this.request(endpoint);
  }

  // Location inference
  async inferLocationsFast(params: {
    filename: string;
    weight_span: boolean;
    weight_branch_length: boolean;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.INFERENCE : undefined;
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_FAST, {
      method: 'POST',
      body: JSON.stringify(params),
    }, timeout);
  }

  async inferLocationsSparg(params: {
    filename: string;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.INFERENCE : undefined;
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_SPARG, {
      method: 'POST',
      body: JSON.stringify(params),
    }, timeout);
  }

  async inferLocationsSpacetrees(params: {
    filename: string;
    time_cutoff?: number;
    ancestor_times?: number[];
    use_importance_sampling?: boolean;
    require_common_ancestor?: boolean;
    use_blup?: boolean;
    blup_var?: boolean;
    ne?: number;
    ne_epochs?: number[];
    nes?: number[];
    num_loci?: number;
    locus_size?: number;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.INFERENCE : undefined;
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_SPACETREES, {
      method: 'POST',
      body: JSON.stringify(params),
    }, timeout);
  }

  async inferLocationsGaiaQuadratic(params: {
    filename: string;
    use_branch_lengths?: boolean;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.INFERENCE : undefined;
    return this.request<any>('/infer-locations-gaia-quadratic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }, timeout);
  }

  async inferLocationsGaiaLinear(params: {
    filename: string;
    use_branch_lengths?: boolean;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.INFERENCE : undefined;
    return this.request<any>('/infer-locations-gaia-linear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }, timeout);
  }

  async inferLocationsMidpoint(params: {
    filename: string;
    weight_by_span?: boolean;
    weight_branch_length?: boolean;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.INFERENCE : undefined;
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_MIDPOINT, {
      method: 'POST',
      body: JSON.stringify(params),
    }, timeout);
  }

  // Tree sequence simulation
  async simulateTreeSequence(params: {
    num_samples?: number;
    sequence_length?: number;
    max_time?: number;
    population_size?: number;
    random_seed?: number;
    model?: string;
    filename_prefix?: string;
    crs?: string;
    mutation_rate?: number;
    recombination_rate?: number;
  }) {
    const timeout = isRailway() ? RAILWAY_TIMEOUTS.SIMULATION : undefined;
    return this.request(API_CONFIG.ENDPOINTS.SIMULATE_TREE_SEQUENCE, {
      method: 'POST',
      body: JSON.stringify(params),
    }, timeout);
  }

  // Custom location operations
  async uploadLocationCSV(file: File, csvType: 'sample_locations' | 'node_locations') {
    const url = `${this.baseURL}/upload-location-csv?csv_type=${csvType}`;
    const formData = new FormData();
    formData.append('file', file);

    log.api.call('/upload-location-csv', 'POST', { filename: file.name, csvType });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to upload CSV');
      }

      const data = await response.json();
      log.api.success('/upload-location-csv', 'POST', data);
      
      return { data, status: response.status };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload CSV';
      log.api.error('/upload-location-csv', new Error(errorMsg), 'POST');
      throw error;
    }
  }

  async updateTreeSequenceLocations(params: {
    tree_sequence_filename: string;
    sample_locations_filename: string;
    node_locations_filename: string;
  }) {
    return this.request('/update-tree-sequence-locations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Geographic data operations
  async uploadShapefile(file: File) {
    return this.uploadFile('/geographic/upload-shapefile', file);
  }

  async getShapeData(shapeName: string) {
    return this.request(`/geographic/shape/${encodeURIComponent(shapeName)}`);
  }

  async inferTimesTsdate(params: TsdateInferenceRequest) {
    return this.request(API_CONFIG.ENDPOINTS.INFER_TIMES_TSDATE, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async simplifyTreeSequence(params: {
    filename: string;
    samples?: number[];
    random_sample_count?: number;
    map_nodes?: boolean;
    reduce_to_site_topology?: boolean;
    filter_populations?: boolean;
    filter_individuals?: boolean;
    filter_sites?: boolean;
    filter_nodes?: boolean;
    update_sample_flags?: boolean;
    keep_unary?: boolean;
    keep_unary_in_individuals?: boolean;
    keep_input_roots?: boolean;
    record_provenance?: boolean;
  }) {
    return this.request('/simplify-tree-sequence', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Add health check endpoint
  async checkHealth() {
    return this.request<HealthCheckResponse>(API_CONFIG.ENDPOINTS.HEALTH);
  }

  async downloadEnvironmentFile(): Promise<ApiResponse<string>> {
    const url = `${this.baseURL}/api/download-environment`;
    
    log.api.call('/api/download-environment', 'GET', {});
    
    try {
      const response = await fetch(url, {
        redirect: 'follow' // Handle redirects automatically
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download environment.yml: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      log.api.success('/api/download-environment', 'GET', { 
        size: text.length,
        finalUrl: response.url // Log final URL in case of redirect
      });
      
      return { data: text, status: response.status };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download environment.yml';
      log.api.error('/api/download-environment', new Error(errorMsg), 'GET');
      throw error;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export convenience functions
export const api = {
  // Tree sequence operations
  uploadTreeSequence: (file: File) => apiService.uploadTreeSequence(file),
  getUploadedFiles: () => apiService.getUploadedFiles(),
  getTreeSequenceMetadata: (filename: string) => apiService.getTreeSequenceMetadata(filename),
  deleteTreeSequence: (filename: string) => apiService.deleteTreeSequence(filename),
  downloadTreeSequence: (filename: string, format: 'trees' | 'tsz' = 'trees') =>
    apiService.downloadTreeSequence(filename, format),
  downloadLocationsCSV: (filename: string, options?: Parameters<typeof apiService.downloadLocationsCSV>[1]) =>
    apiService.downloadLocationsCSV(filename, options),
  downloadIntermediateData: (filename: string, dataType: string, format?: 'pkl' | 'csv' | 'npy' | 'zip') =>
    apiService.downloadIntermediateData(filename, dataType, format),
  listIntermediateData: (filename: string) =>
    apiService.listIntermediateData(filename),
  downloadStatisticsCSV: (filename: string) =>
    apiService.downloadStatisticsCSV(filename),
  downloadDiffStatistics: (firstFilename: string, secondFilename: string, format?: 'csv' | 'json') =>
    apiService.downloadDiffStatistics(firstFilename, secondFilename, format),
  
  // Data retrieval
  getGraphData: (filename: string, options?: Parameters<typeof apiService.getGraphData>[1]) => 
    apiService.getGraphData(filename, options),
  
  // Statistics
  getStatisticsForRange: (filename: string, options?: Parameters<typeof apiService.getStatisticsForRange>[1]) =>
    apiService.getStatisticsForRange(filename, options),
  getWindowedStatistics: (filename: string, options: Parameters<typeof apiService.getWindowedStatistics>[1]) =>
    apiService.getWindowedStatistics(filename, options),
  
  // Location inference
  inferLocationsFast: (params: Parameters<typeof apiService.inferLocationsFast>[0]) => 
    apiService.inferLocationsFast(params),
  inferLocationsSparg: (params: Parameters<typeof apiService.inferLocationsSparg>[0]) =>
    apiService.inferLocationsSparg(params),
  inferLocationsSpacetrees: (params: Parameters<typeof apiService.inferLocationsSpacetrees>[0]) =>
    apiService.inferLocationsSpacetrees(params),
  inferLocationsGaiaQuadratic: (params: Parameters<typeof apiService.inferLocationsGaiaQuadratic>[0]) =>
    apiService.inferLocationsGaiaQuadratic(params),
  inferLocationsGaiaLinear: (params: Parameters<typeof apiService.inferLocationsGaiaLinear>[0]) =>
    apiService.inferLocationsGaiaLinear(params),
  inferLocationsMidpoint: (params: Parameters<typeof apiService.inferLocationsMidpoint>[0]) =>
    apiService.inferLocationsMidpoint(params),

  // Tree sequence simulation
  simulateTreeSequence: (params: Parameters<typeof apiService.simulateTreeSequence>[0]) =>
    apiService.simulateTreeSequence(params),

  // Custom location operations
  uploadLocationCSV: (file: File, csvType: 'sample_locations' | 'node_locations') =>
    apiService.uploadLocationCSV(file, csvType),
  updateTreeSequenceLocations: (params: Parameters<typeof apiService.updateTreeSequenceLocations>[0]) =>
    apiService.updateTreeSequenceLocations(params),

  // Geographic operations
  uploadShapefile: (file: File) => apiService.uploadShapefile(file),
  getShapeData: (shapeName: string) => apiService.getShapeData(shapeName),

  // Temporal inference
  inferTimesTsdate: (params: TsdateInferenceRequest) =>
    apiService.inferTimesTsdate(params),

  // Tree sequence simplification
  simplifyTreeSequence: (params: Parameters<typeof apiService.simplifyTreeSequence>[0]) =>
    apiService.simplifyTreeSequence(params),

  // Health check
  checkHealth: () => apiService.checkHealth(),
  
  // Environment file download
  downloadEnvironmentFile: () => apiService.downloadEnvironmentFile(),
}; 