# Yeeflow App Builder 1.15.6

Patch based on 1.15.5. The Custom Code Dashboard definition already existed, but its ID and selection guidance were absent from the registry's selectable-template metadata. Both are now included. Regression checks require registered IDs, selectable IDs and selection-rule keys to agree, reject duplicate selectable IDs, and require a selectable default.

This patch changes template discovery metadata only; it does not add a sixth template, alter page layouts or update live tenant applications. Release and installed-cache checks are recorded in the published release notes.
