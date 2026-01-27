/**
 * Date/Time Helper Functions
 * 
 * CRITICAL: SQL Server stores datetime without timezone information (wall-clock time).
 * JavaScript Date methods like toLocaleString(), toISOString() apply timezone conversions
 * which cause dates to shift (especially in UTC+10/+11).
 * 
 * Always use these utilities when working with datetime fields from the database.
 */

/**
 * Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
 * Preserves wall-clock time without timezone conversion
 * 
 * @param {string|Date} dateStr - Date string or Date object from database
 * @returns {string} Formatted string for datetime-local input
 */
export const formatDateTimeForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Use UTC methods to extract the "wall clock" values without timezone conversion
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format datetime for display (DD/MM/YYYY HH:mm)
 * Preserves wall-clock time without timezone conversion
 * 
 * @param {string|Date} dateStr - Date string or Date object from database
 * @returns {string} Formatted display string
 */
export const formatDateTimeForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // Use UTC methods to extract the "wall clock" values without timezone conversion
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
};

/**
 * Format date for display (DD/MM/YYYY)
 * 
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted display string
 */
export const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // Use UTC methods to extract the "wall clock" values without timezone conversion
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
};

/**
 * Format time range for display (HH:mm - HH:mm)
 * 
 * @param {string|Date} startStr - Start datetime
 * @param {string|Date} endStr - End datetime
 * @returns {string} Formatted time range
 */
export const formatTimeRange = (startStr, endStr) => {
    if (!startStr || !endStr) return '';
    const d1 = new Date(startStr);
    const d2 = new Date(endStr);
    // Use UTC methods to extract the "wall clock" values without timezone conversion
    const formatTime = (d) => `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    return `${formatTime(d1)} - ${formatTime(d2)}`;
};

/**
 * Format datetime with time range for display (DD/MM/YYYY HH:mm - HH:mm)
 * 
 * @param {string|Date} startStr - Start datetime
 * @param {string|Date} endStr - End datetime
 * @returns {string} Formatted datetime range
 */
export const formatDateTimeRange = (startStr, endStr) => {
    if (!startStr || !endStr) return '';
    const d1 = new Date(startStr);
    const d2 = new Date(endStr);
    // Use UTC methods to extract the "wall clock" values without timezone conversion
    const formatTime = (d) => `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    return `${d1.getUTCDate().toString().padStart(2, '0')}/${(d1.getUTCMonth() + 1).toString().padStart(2, '0')}/${d1.getUTCFullYear()} ${formatTime(d1)} - ${formatTime(d2)}`;
};
