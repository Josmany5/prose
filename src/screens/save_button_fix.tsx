// Save button fix - disable only when there's no content AND no formats

// BEFORE (broken):
disabled={!noteContent.trim() && activeFormats.length === 0}

// AFTER (fixed):
disabled={contentAreas.every(area => !area.trim()) && activeFormats.length === 0}
