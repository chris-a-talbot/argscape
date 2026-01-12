import { useCallback, RefObject } from 'react';
import { exportSVGAsImage } from '../lib/imageExport';
import { useColorTheme } from '../context/ColorThemeContext';

export const useDownloadImage = (
    svgRef: RefObject<SVGSVGElement | null>,
    decodedFilename: string
) => {
    const { colors } = useColorTheme();

    const handleDownloadImage = useCallback(async () => {
        const svgElement = svgRef.current;
        if (!svgElement) return;

        try {
            const imageFilename = `${decodedFilename.replace(/\.(trees|tsz)$/, '')}_arg.png`;

            await exportSVGAsImage(svgElement, {
                filename: imageFilename,
                padding: 50,
                maxWidth: 8192,
                maxHeight: 8192,
                backgroundColor: colors.exportBackground,
                scale: 3, // High resolution export
                watermark: {
                    text: 'ARGscape',
                    subtext: decodedFilename,
                    position: 'bottom-center',
                    color: colors.accentPrimary,
                    backgroundColor: colors.background + 'CC' // 80% opacity
                }
            });

            console.log('High-resolution ARG image downloaded successfully');
        } catch (error) {
            console.error('Error downloading ARG image:', error);
        }
    }, [svgRef, decodedFilename, colors.exportBackground, colors.accentPrimary, colors.background]);

    return { handleDownloadImage };
};
