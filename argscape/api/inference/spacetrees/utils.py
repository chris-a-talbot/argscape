"""
Spacetrees utility functions for working with tskit trees.

Adapted from https://github.com/osmond-lab/spacetrees
Osmond & Coop 2024: https://elifesciences.org/articles/72177
"""

import numpy as np
import tskit


def get_shared_times(tree, samples, require_common_ancestor=True):
    """
    Extract shared times matrix from a tskit tree.
    
    Args:
        tree: tskit Tree object
        samples: List of sample node IDs (ordered as in locations)
        require_common_ancestor: If True, return None when not all samples share a common ancestor.
                               If False, use max(root times) as TMRCA and set shared time to 0
                               for pairs that don't share an ancestor (less statistically correct).
        
    Returns:
        List of shared times: [TMRCA, st_0_1, st_0_2, ..., st_0_n, st_1_2, ..., st_(n-1)_n]
        where TMRCA is the diagonal element and st_i_j is shared time between samples i and j.
        Returns None if require_common_ancestor=True and not all samples share a common ancestor.
    """
    # Check if all samples share a common ancestor
    try:
        root = tree.root
        TMRCA = tree.time(root)
        # Single root - all samples share this ancestor
    except ValueError:
        # Multiple roots exist
        if require_common_ancestor:
            # Check if all samples are in the same root subtree
            roots = tree.roots
            sample_roots = set()
            for sample in samples:
                # Find which root subtree this sample belongs to
                current = sample
                while tree.parent(current) != -1:
                    current = tree.parent(current)
                sample_roots.add(current)
            
            # If samples span multiple root subtrees, return None
            if len(sample_roots) > 1:
                return None
            
            # All samples in same subtree - use that root's time
            TMRCA = tree.time(list(sample_roots)[0])
        else:
            # Use max root time (old behavior, less statistically correct)
            roots = tree.roots
            TMRCA = max(tree.time(r) for r in roots)
    
    k = len(samples) #number of samples

    sts = [TMRCA] #the diagonal element for all rows
    for i in range(k):
        for j in range(i+1, k): #just building upper triangular part of symmetric matrix, excluding diagonal
            try:
                # Try to get TMRCA for this pair
                pair_tmrca = tree.tmrca(samples[i], samples[j])
                st = TMRCA - pair_tmrca #shared time of pair
            except ValueError:
                # Nodes don't share a common ancestor in this tree (different root subtrees)
                if require_common_ancestor:
                    # This shouldn't happen if we checked above, but handle it anyway
                    return None
                # Their shared time is 0 (old behavior)
                st = 0.0
            sts.append(st)

    return sts


def chop_shared_times(shared_times, T=None):
    """
    Chop shared times to ignore history beyond time T.
    
    Args:
        shared_times: Vector of shared times
        T: Time cutoff (if None, no chopping)
        
    Returns:
        Chopped shared times vector
    """
    TMRCA = shared_times[0] #tmrca

    if T is None or T > TMRCA: #dont cut if dont ask or cut time older than MRCA
        pass
    else:
        shared_times = T - (TMRCA - shared_times) #calculate shared times since T

    return shared_times


def center_shared_times(shared_times):
    """
    Center shared times matrix by subtracting mean.
    
    Args:
        shared_times: Vector of shared times (will be converted to matrix)
        
    Returns:
        Centered shared times matrix
    """
    # Convert vector to matrix first to get number of samples
    k = int((np.sqrt(1+8*(len(shared_times)-1))+1)/2) #get number of samples from vector length
    sts_mat = np.zeros((k, k)) #initialize matrix
    sts_mat[np.triu_indices(k, k=1)] = shared_times[1:] #fill in upper triangle
    sts_mat = sts_mat + sts_mat.T + np.diag([shared_times[0]]*k) #add lower triangle and diagonal
    
    # Create mean centering matrix (k-1 x k) to remove one dimension
    Tmat = np.identity(k) - np.ones((k, k)) / k
    Tmat = Tmat[0:-1] #drop last row to get (k-1) x k matrix
    
    # Center the matrix: Tmat @ sts_mat @ Tmat^T
    stc = np.matmul(Tmat, np.matmul(sts_mat, np.transpose(Tmat))) #center shared times in subtree
 
    return stc


def log_coal_density(times, Nes, epochs=None, T=None):
    """
    Log probability of coalescent times under standard neutral/panmictic coalescent.
    
    Args:
        times: Array of coalescence times
        Nes: Array of effective population sizes for each epoch
        epochs: Array of epoch boundaries (if None, single epoch)
        T: Optional time cutoff
        
    Returns:
        Log probability density (scalar)
    """
    # Convert to numpy array if needed
    times = np.asarray(times)
    Nes = np.asarray(Nes)
    
    if epochs is None and len(Nes) == 1:
        epochs = np.array([0, float(np.max(times))]) #one big epoch
        Nes = np.array([float(Nes[0]), float(Nes[0])]) #repeat the effective population size so same length as epochs 

    logp = 0.0 #initialize log probability
    prevt = 0.0 #initialize time
    prevLambda = 0.0 #initialize coalescent intensity
    k = len(times) + 1 #number of samples
    if T is not None:
        times = times[times < T] #ignore old times
    myIntensityMemos = _coal_intensity_memos(epochs, Nes) #intensities up to end of each epoch

    # probability of each coalescence time
    for t in times: #for each coalescence time t
        t = float(t)  # Ensure scalar
        kchoose2 = k * (k - 1) / 2 #binomial coefficient
        Lambda = _coal_intensity_using_memos(t, epochs, myIntensityMemos, Nes) #coalescent intensity up to time t
        # Get epoch index - np.digitize returns array, extract scalar
        digitize_result = np.digitize(np.array([t]), epochs)
        ie = int(digitize_result[0]) if isinstance(digitize_result, np.ndarray) else int(digitize_result)
        # Ensure ie is within bounds (ie is 1-indexed from digitize, so subtract 1 for 0-indexed array)
        ie = max(0, min(ie - 1, len(Nes) - 1))
        logpk = np.log(kchoose2 * 1.0 / (2.0 * float(Nes[ie]))) - kchoose2 * (Lambda - prevLambda) #log probability (waiting times are time-inhomogeneous exponentially distributed)
        logp += logpk #add log probability
        prevt = t #update time
        prevLambda = Lambda #update intensity
        k -= 1 #update number of lineages

    # now add the probability of lineages not coalescing by T 
    if k > 1 and T is not None: #if we have more than one lineage remaining
        kchoose2 = k * (k - 1) / 2 #binomial coefficient
        Lambda = _coal_intensity_using_memos(float(T), epochs, myIntensityMemos, Nes) #coalescent intensity up to time T 
        logPk = - kchoose2 * (Lambda - prevLambda) #log probability of no coalescence
        logp += logPk #add log probability

    return float(logp)


def _coal_intensity_using_memos(t, epochs, intensityMemos, Nes):
    """Add coal intensity up to time t."""
    t = float(t)
    epochs = np.asarray(epochs)
    # np.digitize returns 1-indexed result, convert to 0-indexed
    digitize_result = np.digitize(np.array([t]), epochs)
    iEpoch = int(digitize_result[0] - 1) if isinstance(digitize_result, np.ndarray) else int(digitize_result - 1)
    # Ensure iEpoch is within bounds
    iEpoch = max(0, min(iEpoch, len(epochs) - 2))
    t1 = float(epochs[iEpoch]) #time at which the previous epoch ended
    Lambda = float(intensityMemos[iEpoch]) #intensity up to end of previous epoch
    Lambda += 1.0 / (2.0 * float(Nes[iEpoch])) * (t - t1) #add intensity for time in current epoch
    return Lambda


def _coal_intensity_memos(epochs, Nes):
    """Coalescence intensity up to the end of each epoch."""
    epochs = np.asarray(epochs)
    Nes = np.asarray(Nes)
    Lambda = np.zeros(len(epochs))
    for ie in range(1, len(epochs)):
        t0 = float(epochs[ie - 1]) #start time
        t1 = float(epochs[ie]) #end time
        Lambda[ie] = (t1 - t0) #elapsed time
        Lambda[ie] *= 1.0 / (2.0 * float(Nes[ie - 1])) #multiply by coalescence intensity
        Lambda[ie] += Lambda[ie - 1] #add previous intensity

    return Lambda

