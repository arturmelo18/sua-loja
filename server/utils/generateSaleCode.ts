export function generateSaleCode(): string {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `SL-${dateStr}-${random}`
}