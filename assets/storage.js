export function hasLocalStorage() {
  const testKey = 'localStorageTestKey'
  const testValue = 'test'

  try {
    localStorage.setItem(testKey, testValue)
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

export function setLocalStorage(key, value, expiryDays) {
  if (!hasLocalStorage()) return false

  const now = new Date()
  const item = {
    value: value,
    expiry: now.getTime() + expiryDays * 24 * 60 * 60 * 1000,
  }

  try {
    localStorage.setItem(key, JSON.stringify(item))
    return true
  } catch (error) {
    return false
  }
}

export function getLocalStorage(key) {
  if (!hasLocalStorage()) return null

  try {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr)

    // Check if the item is an object with 'value' and 'expiry' properties
    if (item && typeof item === 'object' && 'value' in item && 'expiry' in item) {
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key)
        return null
      }

      return item.value
    }

    return item

  } catch (error) {
    return null
  }
}
