import { useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { FILE_TYPES, RAILWAY_LIMITS, isRailway } from '../../config/constants';
import AlertModal from '../ui/AlertModal';
import { useColorTheme } from '../../context/ColorThemeContext';

const RAILWAY_MAX_NODES = RAILWAY_LIMITS.MAX_NODES;

type DropzoneProps = {
  onUploadComplete?: (result: any) => void;
  setLoading: (isLoading: boolean) => void;
  showNodeLimitModal?: boolean;
  setShowNodeLimitModal?: (show: boolean) => void;
  showErrorModal?: boolean;
  setShowErrorModal?: (show: boolean) => void;
  errorMessage?: string;
  setErrorMessage?: (message: string) => void;
};

type LocationFiles = {
  sampleLocations: File | null;
  nodeLocations: File | null;
};

export default function Dropzone({ 
  onUploadComplete, 
  setLoading,
  showNodeLimitModal: propShowNodeLimitModal,
  setShowNodeLimitModal: propSetShowNodeLimitModal,
  showErrorModal: propShowErrorModal,
  setShowErrorModal: propSetShowErrorModal,
  errorMessage: propErrorMessage,
  setErrorMessage: propSetErrorMessage,
}: DropzoneProps) {  
  const { colors } = useColorTheme();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'none' | 'load-as-is' | 'add-locations'>('none');
  const [locationFiles, setLocationFiles] = useState<LocationFiles>({
    sampleLocations: null,
    nodeLocations: null
  });
  const [uploadedCsvFiles, setUploadedCsvFiles] = useState<{
    sample_locations?: string;
    node_locations?: string;
  }>({});
  
  // Use parent state if provided, otherwise use local state (for backwards compatibility)
  const [localShowNodeLimitModal, setLocalShowNodeLimitModal] = useState(false);
  const [localShowErrorModal, setLocalShowErrorModal] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState('');
  
  const showNodeLimitModal = propShowNodeLimitModal ?? localShowNodeLimitModal;
  const setShowNodeLimitModal = propSetShowNodeLimitModal ?? setLocalShowNodeLimitModal;
  const showErrorModal = propShowErrorModal ?? localShowErrorModal;
  const setShowErrorModal = propSetShowErrorModal ?? setLocalShowErrorModal;
  const errorMessage = propErrorMessage ?? localErrorMessage;
  const setErrorMessage = propSetErrorMessage ?? setLocalErrorMessage;
  
  const navigate = useNavigate();
  // Use ref to track if we're showing a modal (for synchronous check in finally block)
  const isShowingModalRef = useRef(false);

  // Generate and download CSV template
  const downloadTemplate = (type: 'sample' | 'node') => {
    const headers = 'node_id,x,y,z';
    const exampleRows = type === 'sample'
      ? '0,1.5,2.3,0.0\n1,3.2,4.1,0.0\n2,5.0,6.8,0.0'
      : '0,1.5,2.3,0.0\n1,3.2,4.1,0.0\n2,5.0,6.8,0.0';
    const content = `${headers}\n${exampleRows}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'sample' ? 'sample_locations_template.csv' : 'node_locations_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Main tree sequence file dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setMode('none'); // Reset mode when new file is selected
      setLocationFiles({ sampleLocations: null, nodeLocations: null });
      setUploadedCsvFiles({});
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: FILE_TYPES.ACCEPTED_FORMATS,
  });

  // Sample locations CSV dropzone
  const onDropSampleLocations = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setLocationFiles(prev => ({ ...prev, sampleLocations: acceptedFiles[0] }));
    }
  }, []);

  const sampleLocationsDropzone = useDropzone({
    onDrop: onDropSampleLocations,
    multiple: false,
    accept: FILE_TYPES.CSV_FORMATS,
  });

  // Node locations CSV dropzone
  const onDropNodeLocations = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setLocationFiles(prev => ({ ...prev, nodeLocations: acceptedFiles[0] }));
    }
  }, []);

  const nodeLocationsDropzone = useDropzone({
    onDrop: onDropNodeLocations,
    multiple: false,
    accept: FILE_TYPES.CSV_FORMATS,
  });

  const handleLoadAsIs = async () => {
    if (file) {
      setLoading(true);
      isShowingModalRef.current = false;
      
      try {
        log.user.action('upload-start', { filename: file.name, size: file.size }, 'Dropzone');

        const uploadStartTime = Date.now();
        const result = await api.uploadTreeSequence(file);
        const uploadDuration = Date.now() - uploadStartTime;
        
        // Validate response structure
        if (!result || !result.data) {
          throw new Error('Invalid response from server');
        }
        
        // Only check node count limits if we're on Railway
        // On local installations, allow unlimited node counts
        if (isRailway() && result.data && typeof result.data === 'object' && 'num_nodes' in result.data) {
          const numNodes = (result.data as any).num_nodes;
          if (numNodes && numNodes > RAILWAY_MAX_NODES) {
            isShowingModalRef.current = true;
            setLoading(false);
            setShowNodeLimitModal(true);
            return;
          }
        }
        
        log.info('File upload completed successfully', {
          component: 'Dropzone',
          data: { filename: file.name, result, uploadDuration }
        });
        
        // Clear loading state before navigating away
        setLoading(false);
        
        // Small delay to ensure state updates before navigation
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } catch (err) {
        log.error('File upload failed', {
          component: 'Dropzone',
          error: err instanceof Error ? err : new Error(String(err)),
          data: { filename: file.name }
        });
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const lowerErrorMessage = errorMessage.toLowerCase();
        
        // Check if this is a node limit error (check error message content, not frontend flag)
        // Backend might be in Railway mode even if frontend flag isn't set
        if (lowerErrorMessage.includes('nodes') && lowerErrorMessage.includes('railway limit')) {
          isShowingModalRef.current = true;
          // Set modal state first (this persists in parent component across remounts)
          setShowNodeLimitModal(true);
          // Then set loading to false - parent will remount but modal state is preserved
          setLoading(false);
          return;
        }
        
        // Show general error modal
        isShowingModalRef.current = true;
        setErrorMessage(errorMessage);
        setShowErrorModal(true);
        // Set loading to false so parent renders Dropzone (modal needs component to be mounted)
        setLoading(false);
      }
      // Removed finally block - we handle loading state explicitly in each path
    }
  };

  const handleAddLocations = () => {
    setMode('add-locations');
  };

  const uploadCsvFile = async (file: File, csvType: 'sample_locations' | 'node_locations') => {
    try {
      const result = await api.uploadLocationCSV(file, csvType);
      setUploadedCsvFiles(prev => ({
        ...prev,
        [csvType]: result.data.filename
      }));
      return result.data.filename;
    } catch (err) {
      log.error('CSV upload failed', {
        component: 'Dropzone',
        error: err instanceof Error ? err : new Error(String(err)),
        data: { filename: file.name, csvType }
      });
      throw err;
    }
  };

  const handleUpdateTreeSequence = async () => {
    if (!file || !locationFiles.sampleLocations || !locationFiles.nodeLocations) {
      return;
    }

    setLoading(true);
    isShowingModalRef.current = false;

    try {
      // First upload the main tree sequence file
      log.user.action('upload-start', { filename: file.name, size: file.size }, 'Dropzone');
      await api.uploadTreeSequence(file);

      // Upload CSV files if not already uploaded
      let sampleLocationsFilename = uploadedCsvFiles.sample_locations;
      let nodeLocationsFilename = uploadedCsvFiles.node_locations;

      if (!sampleLocationsFilename && locationFiles.sampleLocations) {
        sampleLocationsFilename = await uploadCsvFile(locationFiles.sampleLocations, 'sample_locations');
      }

      if (!nodeLocationsFilename && locationFiles.nodeLocations) {
        nodeLocationsFilename = await uploadCsvFile(locationFiles.nodeLocations, 'node_locations');
      }

      if (!sampleLocationsFilename || !nodeLocationsFilename) {
        throw new Error('Failed to upload CSV files');
      }

      // Update tree sequence with custom locations
      const updateResult = await api.updateTreeSequenceLocations({
        tree_sequence_filename: file.name,
        sample_locations_filename: sampleLocationsFilename,
        node_locations_filename: nodeLocationsFilename
      });

      log.info('Tree sequence updated with custom locations', {
        component: 'Dropzone',
        data: { originalFilename: file.name, newFilename: (updateResult.data as any).new_filename }
      });

      // Clear loading state before calling callback
      setLoading(false);
      
      if (onUploadComplete) {
        onUploadComplete(updateResult.data);
      }

    } catch (err) {
      log.error('Tree sequence update failed', {
        component: 'Dropzone',
        error: err instanceof Error ? err : new Error(String(err)),
        data: { filename: file.name }
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Check if this is a node limit error (check error message content, not frontend flag)
      // Backend might be in Railway mode even if frontend flag isn't set
      if (lowerErrorMessage.includes('nodes') && lowerErrorMessage.includes('railway limit')) {
        isShowingModalRef.current = true;
        setShowNodeLimitModal(true);
        // Set loading to false so parent renders Dropzone (modal needs component to be mounted)
        setLoading(false);
        return;
      }
      
      // Show general error modal
      isShowingModalRef.current = true;
      setErrorMessage(errorMessage);
      setShowErrorModal(true);
      // Set loading to false so parent renders Dropzone (modal needs component to be mounted)
      setLoading(false);
    } finally {
      // Only set loading to false if we're not showing a modal
      // This prevents the parent from unmounting us while modals are showing
      if (!isShowingModalRef.current) {
        setLoading(false);
      }
    }
  };

  const canUpdateTreeSequence = file && 
    locationFiles.sampleLocations && 
    locationFiles.nodeLocations;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Main tree sequence file dropzone or File Card */}
      {file ? (
        /* File Card - compact display when file is selected */
        <div
          className="w-full flex items-center gap-3 p-4 rounded-xl border"
          style={{
            backgroundColor: colors.containerBackground,
            borderColor: colors.border
          }}
        >
          {/* File icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${colors.accentPrimary}20` }}
          >
            <svg className="w-5 h-5" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* File name */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: colors.text }}>
              {file.name}
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              setMode('none');
              setLocationFiles({ sampleLocations: null, nodeLocations: null });
              setUploadedCsvFiles({});
            }}
            className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-opacity-80"
            style={{
              backgroundColor: `${colors.error || '#ef4444'}15`,
              color: colors.error || '#ef4444'
            }}
            title="Remove file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Dropzone - shown when no file selected */
        <div
          {...getRootProps()}
          className="w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center text-xl transition-colors cursor-pointer select-none"
          style={{
            borderColor: isDragActive ? colors.accentPrimary : colors.border,
            backgroundColor: isDragActive ? `${colors.accentPrimary}10` : colors.containerBackground,
            color: colors.text
          }}
          tabIndex={0}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <span>Drop the file here…</span>
          ) : (
            <span className="text-center">
              Drag and drop to select a file<br />
              <span className="text-base" style={{ color: colors.accentPrimary }}>or click to browse</span><br />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Supported formats: .trees, .tsz</span>
            </span>
          )}
        </div>
      )}

      {/* Action buttons when file is selected */}
      {file && mode === 'none' && (
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLoadAsIs}
            className="font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            style={{
              backgroundColor: colors.accentPrimary,
              color: colors.buttonText
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Load as-is
          </button>
          <button
            type="button"
            onClick={handleAddLocations}
            className="font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 border"
            style={{
              backgroundColor: colors.containerBackground,
              color: colors.text,
              borderColor: colors.border
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accentPrimary;
              e.currentTarget.style.color = colors.buttonText;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.containerBackground;
              e.currentTarget.style.color = colors.text;
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Add locations
          </button>
        </div>
      )}

      {/* Location CSV upload section */}
      {mode === 'add-locations' && (
        <div className="w-full space-y-4">
          <div className="text-center text-sm mb-4" style={{ color: colors.textSecondary }}>
            Upload CSV files with node locations (required columns: node_id, x, y, z)
          </div>

          {/* Sample Locations CSV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm" style={{ color: colors.text }}>Sample Locations</label>
              <button
                type="button"
                onClick={() => downloadTemplate('sample')}
                className="text-xs underline hover:opacity-80 transition-opacity"
                style={{ color: colors.accentPrimary }}
              >
                Download CSV template
              </button>
            </div>
            {locationFiles.sampleLocations ? (
              /* File Card for sample locations */
              <div
                className="w-full flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  backgroundColor: colors.containerBackground,
                  borderColor: colors.border
                }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${colors.accentPrimary}20` }}
                >
                  <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="flex-1 text-sm truncate" style={{ color: colors.text }}>
                  {locationFiles.sampleLocations.name}
                </span>
                <button
                  type="button"
                  onClick={() => setLocationFiles(prev => ({ ...prev, sampleLocations: null }))}
                  className="flex-shrink-0 p-1.5 rounded-md transition-colors"
                  style={{
                    backgroundColor: `${colors.error || '#ef4444'}15`,
                    color: colors.error || '#ef4444'
                  }}
                  title="Remove file"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Dropzone for sample locations */
              <div
                {...sampleLocationsDropzone.getRootProps()}
                className="w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer select-none"
                style={{
                  borderColor: sampleLocationsDropzone.isDragActive ? colors.accentPrimary : colors.border,
                  backgroundColor: sampleLocationsDropzone.isDragActive ? `${colors.accentPrimary}10` : colors.containerBackground,
                  color: colors.text
                }}
                tabIndex={0}
              >
                <input {...sampleLocationsDropzone.getInputProps()} />
                {sampleLocationsDropzone.isDragActive ? (
                  <span>Drop CSV here…</span>
                ) : (
                  <span>Click or drag CSV with sample locations</span>
                )}
              </div>
            )}
          </div>

          {/* Node Locations CSV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm" style={{ color: colors.text }}>Node Locations</label>
              <button
                type="button"
                onClick={() => downloadTemplate('node')}
                className="text-xs underline hover:opacity-80 transition-opacity"
                style={{ color: colors.accentPrimary }}
              >
                Download CSV template
              </button>
            </div>
            {locationFiles.nodeLocations ? (
              /* File Card for node locations */
              <div
                className="w-full flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  backgroundColor: colors.containerBackground,
                  borderColor: colors.border
                }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${colors.accentPrimary}20` }}
                >
                  <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="flex-1 text-sm truncate" style={{ color: colors.text }}>
                  {locationFiles.nodeLocations.name}
                </span>
                <button
                  type="button"
                  onClick={() => setLocationFiles(prev => ({ ...prev, nodeLocations: null }))}
                  className="flex-shrink-0 p-1.5 rounded-md transition-colors"
                  style={{
                    backgroundColor: `${colors.error || '#ef4444'}15`,
                    color: colors.error || '#ef4444'
                  }}
                  title="Remove file"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Dropzone for node locations */
              <div
                {...nodeLocationsDropzone.getRootProps()}
                className="w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer select-none"
                style={{
                  borderColor: nodeLocationsDropzone.isDragActive ? colors.accentPrimary : colors.border,
                  backgroundColor: nodeLocationsDropzone.isDragActive ? `${colors.accentPrimary}10` : colors.containerBackground,
                  color: colors.text
                }}
                tabIndex={0}
              >
                <input {...nodeLocationsDropzone.getInputProps()} />
                {nodeLocationsDropzone.isDragActive ? (
                  <span>Drop CSV here…</span>
                ) : (
                  <span>Click or drag CSV with node locations</span>
                )}
              </div>
            )}
          </div>

          {/* Load with Locations button */}
          <button
            type="button"
            onClick={handleUpdateTreeSequence}
            disabled={!canUpdateTreeSequence}
            className="w-full font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              backgroundColor: canUpdateTreeSequence ? colors.accentPrimary : colors.border,
              color: canUpdateTreeSequence ? colors.buttonText : colors.textSecondary,
              cursor: canUpdateTreeSequence ? 'pointer' : 'not-allowed',
              opacity: canUpdateTreeSequence ? 1 : 0.5
            }}
            onMouseEnter={(e) => canUpdateTreeSequence && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => canUpdateTreeSequence && (e.currentTarget.style.opacity = '1')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Load with Locations
          </button>

          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setMode('none');
              setLocationFiles({ sampleLocations: null, nodeLocations: null });
              setUploadedCsvFiles({});
            }}
            className="w-full font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border"
            style={{
              backgroundColor: colors.containerBackground,
              color: colors.text,
              borderColor: colors.border
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accentPrimary;
              e.currentTarget.style.color = colors.buttonText;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.containerBackground;
              e.currentTarget.style.color = colors.text;
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}

      {/* Node Limit Modal */}
      <AlertModal
        isOpen={showNodeLimitModal}
        title="Node Limit Exceeded"
        message={`The tree sequence has more than ${RAILWAY_MAX_NODES} nodes and has been deleted. For larger ARGs, please install ARGscape locally via Python.`}
        buttonText="Install Locally"
        secondaryButtonText="Close"
        type="error"
        onClose={() => {
          isShowingModalRef.current = false;
          setShowNodeLimitModal(false);
          setLoading(false);
          navigate('/install');
        }}
        onSecondaryAction={() => {
          isShowingModalRef.current = false;
          setShowNodeLimitModal(false);
          setLoading(false);
        }}
      />

      {/* General Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        title="Upload Failed"
        message={errorMessage}
        buttonText="OK"
        type="error"
        onClose={() => {
          isShowingModalRef.current = false;
          setShowErrorModal(false);
          setLoading(false);
        }}
      />
    </div>
  );
} 