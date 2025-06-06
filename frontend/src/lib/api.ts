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

interface ApiError {
  message: string;
  status?: number;
  details?: string;
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error: ApiError = {
          message: `HTTP error! status: ${response.status}`,
          status: response.status,
          details: errorData?.detail || 'No details available',
        };
        
        log.api.error(endpoint, new Error(error.message), method);
        throw error;
      }

      const data = await response.json();
      log.api.success(endpoint, method, data);
      
      return { data, status: response.status };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timed out after 60 seconds');
          log.api.error(endpoint, timeoutError, method);
          throw timeoutError;
        }
        log.api.error(endpoint, error, method);
        throw error;
      }
      
      const apiError: ApiError = {
        message: ERROR_MESSAGES.UNKNOWN_ERROR,
        details: String(error),
      };
      
      log.api.error(endpoint, new Error(apiError.message), method);
      throw apiError;
    }
  }

  private async uploadFile(endpoint: string, file: File): Promise<ApiResponse> {
    // Use the simplified endpoint that automatically uses client IP
    const url = `${this.baseURL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    log.api.call(endpoint, 'POST', { filename: file.name, size: file.size });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.UPLOAD_FAILED);
      }

      const data = await response.json();
      log.api.success(endpoint, 'POST', data);
      
      return { data, status: response.status };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.UPLOAD_FAILED;
      log.api.error(endpoint, new Error(errorMsg), 'POST');
      throw error;
    }
  }

  // Session management - simplified with IP-based sessions
  async getCurrentSession() {
    return this.request(API_CONFIG.ENDPOINTS.GET_SESSION);
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

  async downloadTreeSequence(filename: string): Promise<Blob> {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE}/${encodeURIComponent(filename)}`;
    
    log.api.call(API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE, 'GET', { filename });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
      }
      
      const blob = await response.blob();
      log.api.success(API_CONFIG.ENDPOINTS.DOWNLOAD_TREE_SEQUENCE, 'GET', { size: blob.size });
      
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
      sampleOrder?: string;
    } = {}
  ) {
    const params = new URLSearchParams();
    if (options.maxSamples) params.append('max_samples', options.maxSamples.toString());
    if (options.genomicStart !== undefined) params.append('genomic_start', options.genomicStart.toString());
    if (options.genomicEnd !== undefined) params.append('genomic_end', options.genomicEnd.toString());
    if (options.treeStartIdx !== undefined) params.append('tree_start_idx', options.treeStartIdx.toString());
    if (options.treeEndIdx !== undefined) params.append('tree_end_idx', options.treeEndIdx.toString());
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

  // Tree sequence simulation
  async simulateTreeSequence(params: {
    num_samples?: number;
    num_local_trees?: number;
    max_time?: number;
    population_size?: number;
    random_seed?: number;
    model?: string;
    filename_prefix?: string;
    crs?: string;
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
  async getAvailableCRS() {
    return this.request('/geographic/crs');
  }

  async getAvailableShapes() {
    return this.request('/geographic/shapes');
  }

  async uploadShapefile(file: File) {
    return this.uploadFile('/geographic/upload-shapefile', file);
  }

  async getShapeData(shapeName: string) {
    return this.request(`/geographic/shape/${encodeURIComponent(shapeName)}`);
  }

  async transformCoordinates(params: {
    filename: string;
    source_crs: string;
    target_crs: string;
  }) {
    return this.request('/geographic/transform-coordinates', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async validateSpatialData(params: {
    filename: string;
    shape_name?: string;
    shape_data?: any;
  }) {
    return this.request('/geographic/validate-spatial', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export convenience functions
export const api = {
  // Session management
  getCurrentSession: () => apiService.getCurrentSession(),
  
  // Tree sequence operations
  uploadTreeSequence: (file: File) => apiService.uploadTreeSequence(file),
  getUploadedFiles: () => apiService.getUploadedFiles(),
  getTreeSequenceMetadata: (filename: string) => apiService.getTreeSequenceMetadata(filename),
  deleteTreeSequence: (filename: string) => apiService.deleteTreeSequence(filename),
  downloadTreeSequence: (filename: string) => apiService.downloadTreeSequence(filename),
  
  // Data retrieval
  getGraphData: (filename: string, options?: Parameters<typeof apiService.getGraphData>[1]) => 
    apiService.getGraphData(filename, options),
  
  // Location inference
  inferLocationsFast: (params: Parameters<typeof apiService.inferLocationsFast>[0]) => 
    apiService.inferLocationsFast(params),

  // Tree sequence simulation
  simulateTreeSequence: (params: Parameters<typeof apiService.simulateTreeSequence>[0]) =>
    apiService.simulateTreeSequence(params),

  // Custom location operations
  uploadLocationCSV: (file: File, csvType: 'sample_locations' | 'node_locations') =>
    apiService.uploadLocationCSV(file, csvType),
  updateTreeSequenceLocations: (params: Parameters<typeof apiService.updateTreeSequenceLocations>[0]) =>
    apiService.updateTreeSequenceLocations(params),

  // Geographic operations
  getAvailableCRS: () => apiService.getAvailableCRS(),
  getAvailableShapes: () => apiService.getAvailableShapes(),
  uploadShapefile: (file: File) => apiService.uploadShapefile(file),
  getShapeData: (shapeName: string) => apiService.getShapeData(shapeName),
  transformCoordinates: (params: Parameters<typeof apiService.transformCoordinates>[0]) =>
    apiService.transformCoordinates(params),
  validateSpatialData: (params: Parameters<typeof apiService.validateSpatialData>[0]) =>
    apiService.validateSpatialData(params),
}; 