export function safeParseJson(json, fallbackValue = []) {
  try { 
    return JSON.parse(json) || fallbackValue 
  } catch (err) {
    return fallbackValue
  }
}


export function checkPendingTodoIsOvertime (todo) {
  if (todo.status !== 'pending') {
    return false
  }
  const start = todo.start
  const [date, time] = splitDateAndTime(start)
  const [day, month, year] = date.split('/').map((d) => Number(d))
  const [hour, minute] = time.split(':').map((d) => Number(d))
  
  const now = new Date()

  if (now.getFullYear() < year) {
    return false
  }

  if (now.getFullYear() > year) {
    return true
  }

  // cuz januari is 0 and dec is 11
  if (now.getMonth() + 1 > month) {
    return true
  }

  if (now.getMonth() + 1 < month) {
    return false
  }
  
  if ((now.getDate() - day) > 1) {
    return true
  }

  if (now.getDate() <= day) {
    return false
  }

  // this only work where sub day = 1 ex: now = 2023-02-02 start = 2023-02-01
  const localeTime = now.toLocaleTimeString()
  const [_,type] = localeTime.split(' ')
  let [nowHour, nowMinute] = localeTime.split(':').slice(0,2).map((d) => Number(d))

  if (type == 'PM') {
    nowHour += 12
  }

  if (nowHour === hour && nowMinute > minute) {
    return true
  }

  console.log('taixx')
  return nowHour > hour
}

export function splitDateAndTime(dateString) {
  const [date, time] = dateString.split(' ')
  return [date, time]
}

/**
 * NOTE this only work for date string with format d/m/Y
 * determine date1 greater than date2
 * @param {string} dateString1
 * @param {string} dateString2
 */
export function dateGt(dateString1, dateString2) {
  const [date1, time1] = splitDateAndTime(dateString1)
  const [date2, time2] = splitDateAndTime(dateString2)

  const [day1, month1, year1] = date1.split('/')
  const [day2, month2, year2] = date2.split('/')

  if (year1 != year2) {
    // return true if year 1 greater otherwise return false
    return year1 > year2
  }

  if (month1 != month2) {
    return month1 > month2
  }

  if (day1 != day2) {
    if (day1 <= day2) {
      return false
    }

    const [hour1, minute1] = time1.split(':')
    const [hour2, minute2] = time2.split(':')

    if (hour1 != hour2) {
      return hour1 > hour2
    }

    return minute1 > minute2
  }

  // cuz day1 === day2
  return false
}

export function toDMY(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based
  const year = date.getFullYear()

  const formattedDate = `${day}/${month}/${year}`
  return formattedDate
}

export function alreadyInstalled() {
  console.log(window.matchMedia('(display-mode: standalone)').matches )
  return window.matchMedia('(display-mode: standalone)').matches 
    || window.navigator.standalone === true
}

