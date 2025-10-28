/**
 * Centralized API service
 * Provides consistent API calls with error handling and logging
 * Now uses IP-based persistent sessions for simplified session management
 */

import { API_CONFIG, ERROR_MESSAGES } from '../config/constants';
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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';

    log.api.call(endpoint, method, options.body);

    // Add retries for initial connection
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add timeout for long-running operations
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
          throw new Error(errorDetail);
        }

        log.api.success(endpoint, method, data ?? rawText);
        return { data: (data ?? (rawText as any)), status: response.status };
      } catch (error) {
        // If this is already an Error object with a message from our error handling above, use it
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            const timeoutError = new Error('Request timed out after 60 seconds');
            log.api.error(endpoint, timeoutError, method);
            throw timeoutError;
          }
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          log.api.error(endpoint, lastError, method);
          throw lastError;
        }
        
        // Otherwise wait and retry
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      let rawText: string | null = null;

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

      if (!response.ok) {
        const errorDetail = (data && (data.detail || data.message)) || rawText || ERROR_MESSAGES.UPLOAD_FAILED;
        throw new Error(errorDetail);
      }

      log.api.success(endpoint, 'POST', data ?? rawText);
      return { data: (data ?? (rawText as any)), status: response.status };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.UPLOAD_FAILED;
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

  // Location inference
  async inferLocationsFast(params: {
    filename: string;
    weight_span: boolean;
    weight_branch_length: boolean;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_FAST, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async inferLocationsSparg(params: {
    filename: string;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_SPARG, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async inferLocationsGaiaQuadratic(params: {
    filename: string;
  }) {
    return this.request<any>('/infer-locations-gaia-quadratic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  async inferLocationsGaiaLinear(params: {
    filename: string;
  }) {
    return this.request<any>('/infer-locations-gaia-linear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  async inferLocationsMidpoint(params: {
    filename: string;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.INFER_LOCATIONS_MIDPOINT, {
      method: 'POST',
      body: JSON.stringify(params),
    });
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
    return this.request(API_CONFIG.ENDPOINTS.SIMULATE_TREE_SEQUENCE, {
      method: 'POST',
      body: JSON.stringify(params),
    });
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
  
  // Data retrieval
  getGraphData: (filename: string, options?: Parameters<typeof apiService.getGraphData>[1]) => 
    apiService.getGraphData(filename, options),
  
  // Location inference
  inferLocationsFast: (params: Parameters<typeof apiService.inferLocationsFast>[0]) => 
    apiService.inferLocationsFast(params),
  inferLocationsSparg: (params: Parameters<typeof apiService.inferLocationsSparg>[0]) =>
    apiService.inferLocationsSparg(params),
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