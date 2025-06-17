#!/usr/bin/env python3
"""
Enhanced Spatial Embedding Demo with Live Stress Display
--------------------------------------------------------
Creates a 3-panel animation:
  - (1) Static genealogical distance matrix (target)
  - (2) Animated Euclidean distance matrix of 2D points
  - (3) Animated 2D scatter plot of points + live stress

The genealogical matrix is constructed with:
  - Two tight clusters (2 samples each)
  - One distant outlier
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, PillowWriter
from matplotlib import gridspec
from sklearn.manifold import MDS
from pathlib import Path

# Configuration
np.random.seed(42)
n = 5
labels = ["C1_A", "C1_B", "C2_A", "C2_B", "Out"]
outdir = Path("output_3panel")
outdir.mkdir(parents=True, exist_ok=True)

# Genealogical Distance Matrix
D = np.array([
    [0.0, 0.1, 0.7, 0.8, 1.5],
    [0.1, 0.0, 0.6, 0.75, 1.6],
    [0.7, 0.6, 0.0, 0.1, 1.4],
    [0.8, 0.75, 0.1, 0.0, 1.3],
    [1.5, 1.6, 1.4, 1.3, 0.0]
])

# Initial & Final Coordinates (unscaled)
init_coords = np.random.rand(n, 2)
mds = MDS(n_components=2, dissimilarity='precomputed', random_state=42, max_iter=300, n_init=4)
final_coords = mds.fit_transform(D)

# Determine axis limits from both initial and final coordinates
all_coords = np.vstack([init_coords, final_coords])
mins = all_coords.min(axis=0)
maxs = all_coords.max(axis=0)
padding = 0.1 * (maxs - mins)
plot_xlim = (mins[0] - padding[0], maxs[0] + padding[0])
plot_ylim = (mins[1] - padding[1], maxs[1] + padding[1])

# Frame interpolation setup
n_interp = 30
hold_frames = 10
n_frames = hold_frames + n_interp + hold_frames

def interpolate_coords(t):
    if t < hold_frames:
        return init_coords
    elif t >= hold_frames + n_interp:
        return final_coords
    else:
        alpha = (t - hold_frames) / (n_interp - 1)
        return (1 - alpha) * init_coords + alpha * final_coords

# Setup figure and axes
fig = plt.figure(figsize=(12, 4))
gs = gridspec.GridSpec(1, 3, width_ratios=[1, 1, 1], wspace=0.4)

# Panel 1: Static genealogical distance matrix
ax1 = fig.add_subplot(gs[0])
im1 = ax1.imshow(D, cmap='viridis', vmin=0, vmax=D.max())
ax1.set_title("Genealogical Distances")
ax1.set_xticks(range(n))
ax1.set_yticks(range(n))
ax1.set_xticklabels(labels, rotation=45, ha='right')
ax1.set_yticklabels(labels)
plt.colorbar(im1, ax=ax1, fraction=0.046)

# Panel 2: Animated spatial distance matrix
ax2 = fig.add_subplot(gs[1])
euc_placeholder = np.zeros_like(D)
im2 = ax2.imshow(euc_placeholder, cmap='viridis', vmin=0, vmax=D.max())
ax2.set_title("Spatial Distances")
ax2.set_xticks(range(n))
ax2.set_yticks(range(n))
ax2.set_xticklabels(labels, rotation=45, ha='right')
ax2.set_yticklabels(labels)
plt.colorbar(im2, ax=ax2, fraction=0.046)

# Panel 3: Animated 2D scatter plot (ℝ² axes)
ax3 = fig.add_subplot(gs[2])
ax3.set_xlim(*plot_xlim)
ax3.set_ylim(*plot_ylim)
ax3.set_aspect('equal', 'box')
ax3.set_xlabel("X (ℝ)")
ax3.set_ylabel("Y (ℝ)")
ax3.grid(True, linestyle='--', alpha=0.5)
ax3.set_xticklabels([])  # Remove number labels
ax3.set_yticklabels([])

scat = ax3.scatter([], [])
texts = [ax3.text(0, 0, '', fontsize=9, ha='center', va='center') for _ in range(n)]
title_text = ax3.set_title("")

def init():
    scat.set_offsets(np.zeros((n, 2)))
    for txt in texts:
        txt.set_text("")
        txt.set_position((0, 0))
    title_text.set_text("")
    return [im2, scat, *texts, title_text]

def update(frame):
    coords = interpolate_coords(frame)
    euc_dist = np.linalg.norm(coords[:, None, :] - coords[None, :, :], axis=-1)
    stress = np.sqrt(np.sum((euc_dist - D) ** 2) / 2)

    # Blend spatial distances visually toward genealogical distances
    if frame < hold_frames:
        display_dist = euc_dist
    elif frame >= hold_frames + n_interp:
        display_dist = D
    else:
        alpha = (frame - hold_frames) / (n_interp - 1)
        display_dist = (1 - alpha) * euc_dist + alpha * D

    im2.set_data(display_dist)
    scat.set_offsets(coords)

    # Update label positions and text
    for i, txt in enumerate(texts):
        x, y = coords[i]
        txt.set_text(labels[i])
        if labels[i] == "C1_B":
            txt.set_position((x - 0.02, y))
            txt.set_ha('right'); txt.set_va='center'
        elif labels[i] in ("C1_A", "C2_A", "C2_B"):
            txt.set_position((x + 0.02, y))
            txt.set_ha('left'); txt.set_va='center'
        elif labels[i] == "Out":
            txt.set_position((x, y + 0.06))  # further above
            txt.set_ha('center'); txt.set_va='bottom'

    title_text.set_text(f"Embedding Coordinates\nStress = {stress:.3f}")
    return [im2, scat, *texts, title_text]

# Animate
anim = FuncAnimation(
    fig, update, init_func=init, frames=n_frames,
    interval=150, blit=True
)

# Save output
gif_path = outdir / "3panel_embedding.gif"
anim.save(gif_path, writer=PillowWriter(fps=5))
plt.close(fig)
print(f"Saved → {gif_path}")

# Second animation: show normalization into [0,1] box with visual frame
fig2, ax = plt.subplots(figsize=(4.5, 4.5))

# Compute normalization parameters
min_vals = final_coords.min(axis=0)
max_vals = final_coords.max(axis=0)
range_vals = max_vals - min_vals
norm_coords = (final_coords - min_vals) / range_vals

# Expanded plot limits
buffer = 0.6
ax.set_xlim(-buffer, 1 + buffer)
ax.set_ylim(-buffer, 1 + buffer)
ax.set_aspect('equal', 'box')
ax.set_xlabel("X")
ax.set_ylabel("Y")
ax.grid(True, linestyle='--', alpha=0.5)

# Draw unit square box to highlight [0,1] target
unit_box = plt.Rectangle((0, 0), 1, 1, linewidth=2, edgecolor='red', facecolor='none', linestyle='--')
ax.add_patch(unit_box)

# Setup scatter and labels
scat2 = ax.scatter([], [])
texts2 = [ax.text(0, 0, '', fontsize=9, ha='center', va='center') for _ in range(n)]
title2 = ax.set_title("")

# Animation setup
n_interp2 = 30
hold_frames2 = 10
n_frames2 = hold_frames2 + n_interp2 + hold_frames2

def interpolate_normalization(t):
    if t < hold_frames2:
        return final_coords
    elif t >= hold_frames2 + n_interp2:
        return norm_coords
    else:
        alpha = (t - hold_frames2) / (n_interp2 - 1)
        return (1 - alpha) * final_coords + alpha * norm_coords

def init2():
    scat2.set_offsets(np.zeros((n, 2)))
    for txt in texts2:
        txt.set_text("")
        txt.set_position((0, 0))
    title2.set_text("")
    return [scat2, *texts2, title2, unit_box]

def update2(frame):
    coords = interpolate_normalization(frame)
    scat2.set_offsets(coords)

    for i, txt in enumerate(texts2):
        x, y = coords[i]
        txt.set_text(labels[i])
        txt.set_fontsize(10)

        if labels[i] == "C1_B":
            txt.set_position((x - 0.02, y))
            txt.set_ha('right')
            txt.set_va('center')
        elif labels[i] in ("C1_A", "C2_A", "C2_B"):
            txt.set_position((x + 0.02, y))
            txt.set_ha('left')
            txt.set_va('center')
        elif labels[i] == "Out":
            txt.set_position((x, y + 0.06))
            txt.set_ha('center')
            txt.set_va('bottom')

    if frame < hold_frames2:
        title2.set_text("Final Embedding (Unnormalized)")
    elif frame >= hold_frames2 + n_interp2:
        title2.set_text("Normalized Embedding → [0,1] Grid")
    else:
        title2.set_text("Normalizing Coordinates...")
        
    return [scat2, *texts2, title2, unit_box]


# Animate and save
anim2 = FuncAnimation(
    fig2, update2, init_func=init2,
    frames=n_frames2, interval=150, blit=True
)

gif_path2 = outdir / "embedding_normalization_box.gif"
anim2.save(gif_path2, writer=PillowWriter(fps=5))
plt.close(fig2)
print(f"Saved → {gif_path2}")
