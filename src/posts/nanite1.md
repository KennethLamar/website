---
title: "Using Nanite with Virtual LEGO Elements in Unreal Engine 5 - Part 1"
date: "2021-12-30"
metaDesc: "An overview of my struggles with Nanite in UE5."
tags:
  - personal
  - LEGO
  - Unreal
  - gaming
---

Unreal Engine 5 has built new features into the engine to make it easier for developers to build massive, high-fidelity worlds. [Nanite](https://docs.unrealengine.com/5.0/en-US/RenderingFeatures/Nanite/) provides a virtualized geometry system, meant to replace the need for [LODs](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) while enabling extreme geometric detail up close. 

I was personally interested in trying this new technology on LEGO brick-built scenes, as LEGO bricks are small, [voxel](https://en.wikipedia.org/wiki/Voxel)-like elements with limited options for LODs per-brick. I set out on an overambitious project to procedurally generate a performant, brick-built, minifig-scale island using Nanite to handle LODs. 

I found a significant limitation with Nanite that hampered my efforts. Voxel-like worlds, without careful optimization, are one of the worst-case scenarios for Nanite. Nanite works by breaking down clusters of polygons into hierarchal groups that can be simplified down on a per-cluster basis into reduced levels of detail. On something as simple as a cube, there are no clusters to simplify down to. Additionally, the elements I was using suffered from using disconnected meshes for the block, the stud, and each portion of the LEGO logo on top of the studs. These disconnected meshes are referred to in the Nanite documentation as [faceted normals](https://docs.unrealengine.com/5.0/en-US/RenderingFeatures/Nanite/#facetedandhard-edgenormals). Ultimately, whenever polygons are disconnected, Nanite is unable and unwilling to merge them together. 

This means that, for Nanite to work its magic, LEGO elements must all be merged into large mesh chunks offline, then processed by Nanite for use in-engine. Additionally, portions of LEGO elements, such as the tubes used to improve piece grip, should be removed if they will never be seen, as Nanite has difficulty [culling](https://en.wikipedia.org/wiki/Hidden-surface_determination#Culling_and_Visible_Surface_Determination) [closely stacked surfaces](https://docs.unrealengine.com/5.0/en-US/RenderingFeatures/Nanite/#closelystackedsurfaces). Performing these sorts of operations automatically and at scale is something I haven't fully worked out, although [similar processing](https://www.nvidia.com/en-us/on-demand/session/gtcspring21-e32773/) was done in-engine in [LEGO® Builder's Journey](https://www.lightbrick.com/builders-journey).