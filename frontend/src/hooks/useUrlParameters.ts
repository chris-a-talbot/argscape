import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UrlParameters {
    temporalStart?: number;
    temporalEnd?: number;
    genomicStart?: number;
    genomicEnd?: number;
    treeStartIdx?: number;
    treeEndIdx?: number;
}

export const useUrlParameters = (): UrlParameters => {
    const [searchParams] = useSearchParams();

    const urlParams = useMemo(() => {
        const params: UrlParameters = {};

        const temporalStart = searchParams.get('temporal_start');
        const temporalEnd = searchParams.get('temporal_end');
        const genomicStart = searchParams.get('genomic_start');
        const genomicEnd = searchParams.get('genomic_end');
        const treeStartIdx = searchParams.get('tree_start_idx');
        const treeEndIdx = searchParams.get('tree_end_idx');

        if (temporalStart && temporalEnd) {
            params.temporalStart = parseFloat(temporalStart);
            params.temporalEnd = parseFloat(temporalEnd);
        }

        if (genomicStart && genomicEnd) {
            params.genomicStart = parseInt(genomicStart);
            params.genomicEnd = parseInt(genomicEnd);
        } else if (treeStartIdx && treeEndIdx) {
            params.treeStartIdx = parseInt(treeStartIdx);
            params.treeEndIdx = parseInt(treeEndIdx);
        }

        return params;
    }, [searchParams]);

    return urlParams;
};
