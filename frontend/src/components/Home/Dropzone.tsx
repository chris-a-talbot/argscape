import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { FILE_TYPES } from '../../config/constants';

type DropzoneProps = {
  onUploadComplete?: (result: any) => void;
  setLoading: (isLoading: boolean) => void;
};

type LocationFiles = {
  sampleLocations: File | null;
  nodeLocations: File | null;
};

export default function Dropzone({ onUploadComplete, setLoading }: DropzoneProps) {  
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
      
      try {
        log.user.action('upload-start', { filename: file.name, size: file.size }, 'Dropzone');
        const result = await api.uploadTreeSequence(file);
        
        log.info('File upload completed successfully', {
          component: 'Dropzone',
          data: { filename: file.name, result }
        });
        
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } catch (err) {
        log.error('File upload failed', {
          component: 'Dropzone',
          error: err instanceof Error ? err : new Error(String(err)),
          data: { filename: file.name }
        });
        alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
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
      console.log('Starting tree sequence update...');
      const updateResult = await api.updateTreeSequenceLocations({
        tree_sequence_filename: file.name,
        sample_locations_filename: sampleLocationsFilename,
        node_locations_filename: nodeLocationsFilename
      });

      console.log('Tree sequence update completed:', updateResult);
      log.info('Tree sequence updated with custom locations', {
        component: 'Dropzone',
        data: { originalFilename: file.name, newFilename: (updateResult.data as any).new_filename }
      });

      if (onUploadComplete) {
        console.log('Calling onUploadComplete with:', updateResult.data);
        onUploadComplete(updateResult.data);
      }

    } catch (err) {
      log.error('Tree sequence update failed', {
        component: 'Dropzone',
        error: err instanceof Error ? err : new Error(String(err)),
        data: { filename: file.name }
      });
      alert(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const canUpdateTreeSequence = file && 
    locationFiles.sampleLocations && 
    locationFiles.nodeLocations;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Main tree sequence file dropzone */}
      <div
        {...getRootProps()}
        className={`w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center text-xl transition-colors cursor-pointer select-none
          ${isDragActive ? 'border-sp-pale-green bg-sp-dark-blue text-sp-white' : 'border-sp-dark-blue bg-sp-very-dark-blue text-sp-very-pale-green'}`}
        tabIndex={0}
      >
        <input {...getInputProps()} />
        {file ? (
          <span className="truncate max-w-full px-2">{file.name}</span>
        ) : isDragActive ? (
          <span>Drop the file here…</span>
        ) : (
          <span className="text-center">
            Drag and drop to select a file<br />
            <span className="text-base text-sp-pale-green">or click to browse</span><br />
            <span className="text-sm text-sp-very-pale-green mt-1">Supported formats: .trees, .tsz</span>
          </span>
        )}
      </div>

      {/* Action buttons when file is selected */}
      {file && mode === 'none' && (
        <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={handleLoadAsIs}
            className="w-full bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-2 rounded-lg transition-colors shadow-md text-lg"
          >
            Load as-is
          </button>
          <button
            type="button"
            onClick={handleAddLocations}
            className="w-full bg-sp-very-dark-blue hover:bg-sp-dark-blue text-sp-pale-green border border-sp-dark-blue font-bold py-2 rounded-lg transition-colors shadow-md text-lg"
          >
            Add locations
          </button>
        </div>
      )}

      {/* Location CSV upload section */}
      {mode === 'add-locations' && (
        <div className="w-full space-y-4">
          <div className="text-center text-sp-very-pale-green text-sm mb-4">
            Upload CSV files with node locations (required columns: node_id, x, y, z)
          </div>

          {/* Sample Locations CSV */}
          <div className="space-y-2">
            <label className="text-sp-white font-semibold text-sm">Sample Locations</label>
            <div
              {...sampleLocationsDropzone.getRootProps()}
              className={`w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer select-none
                ${sampleLocationsDropzone.isDragActive ? 'border-sp-pale-green bg-sp-dark-blue text-sp-white' : 'border-sp-dark-blue bg-sp-very-dark-blue text-sp-very-pale-green'}`}
              tabIndex={0}
            >
              <input {...sampleLocationsDropzone.getInputProps()} />
              {locationFiles.sampleLocations ? (
                <span className="truncate max-w-full px-2 text-sp-pale-green">
                  {locationFiles.sampleLocations.name}
                </span>
              ) : sampleLocationsDropzone.isDragActive ? (
                <span>Drop CSV here…</span>
              ) : (
                <span>Click or drag CSV with sample locations</span>
              )}
            </div>
          </div>

          {/* Node Locations CSV */}
          <div className="space-y-2">
            <label className="text-sp-white font-semibold text-sm">Node Locations</label>
            <div
              {...nodeLocationsDropzone.getRootProps()}
              className={`w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer select-none
                ${nodeLocationsDropzone.isDragActive ? 'border-sp-pale-green bg-sp-dark-blue text-sp-white' : 'border-sp-dark-blue bg-sp-very-dark-blue text-sp-very-pale-green'}`}
              tabIndex={0}
            >
              <input {...nodeLocationsDropzone.getInputProps()} />
              {locationFiles.nodeLocations ? (
                <span className="truncate max-w-full px-2 text-sp-pale-green">
                  {locationFiles.nodeLocations.name}
                </span>
              ) : nodeLocationsDropzone.isDragActive ? (
                <span>Drop CSV here…</span>
              ) : (
                <span>Click or drag CSV with node locations</span>
              )}
            </div>
          </div>

          {/* Update Tree Sequence button */}
          <button
            type="button"
            onClick={handleUpdateTreeSequence}
            disabled={!canUpdateTreeSequence}
            className={`w-full font-bold py-2 rounded-lg transition-colors shadow-md text-lg ${
              canUpdateTreeSequence
                ? 'bg-sp-pale-green hover:bg-green-400 text-sp-very-dark-blue'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Update Tree Sequence
          </button>

          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setMode('none');
              setLocationFiles({ sampleLocations: null, nodeLocations: null });
              setUploadedCsvFiles({});
            }}
            className="w-full bg-transparent hover:bg-sp-dark-blue text-sp-very-pale-green border border-sp-dark-blue font-bold py-2 rounded-lg transition-colors shadow-md text-sm"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
} 