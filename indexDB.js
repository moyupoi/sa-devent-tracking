let db = null
let createIndexName = 'siteid'
// indexedDB 的容量限制是当前浏览器存放的物理硬盘大小的50%，如果超过50%则会抛出异常: QuotaExceededError

/**
  * 初始化数据库
  * @returns   {String}
  * {String}   dbName        数据库名称
  * {String}   autoIncrement 是否自动建立索引
  * {String}   version       版本号默认为1
  * {function} callback      回调函数
*/
export const $initDBbase = (dbName, autoIncrement = true, version, callback) => {
  // 打开数据库
  let request = window.indexedDB.open(dbName, 1)
  // 数据库得到结果(最后执行)
  request.onsuccess = event => {
    db = request.result
    callback(db)
  }
  request.onerror = event => {
    console.log('创建数据库失败...')
  }
  // 创建数据库
  request.onupgradeneeded = event => {
    db = event.target.result
    let objectStore
    // 判断数据库是否存在
    if (!db.objectStoreNames.contains(dbName)) {
      objectStore = db.createObjectStore(dbName, { keyPath: 'id', autoIncrement })
      // objectStore.createIndex('id', 'id', { unique: true }) // 创建 id 索引，具有唯一性
      objectStore.createIndex(createIndexName, createIndexName, { unique: false })
    }
  }
}

/**
  * 新增数据
  * @returns {String}
  * {String} dbName   数据库名称
  * {String} id       索引键
  * {String} data     需要新增数据
*/
export const $addDBbase = (dbName, data, res) => {
  return new Promise((resolve, reject) => {
    if (!db) return
    let request = db.transaction([dbName], 'readwrite').objectStore(dbName).add(data)
    request.onsuccess = event => {
      // console.log('数据写入成功!')
      resolve(event.target.result)
    }
    request.onerror = event => {
      reject(event)
      // console.log('数据写入失败...')
    }
  })

}
// export const $addDBbase = (dbName, id, data) => {
//   // 新建相同索引的数据，必须先判断是否已经存在，不能重复插入相同主键的数据
//   let tempData = db.transaction([dbName], 'readwrite').objectStore(dbName).get(id)
//   tempData.onsuccess = event => {
//     if (!event.target.result) {
//       let request = db.transaction([dbName], 'readwrite').objectStore(dbName).add(data)
//       request.onsuccess = event => {
//         // console.log('数据写入成功!')
//       }
//       request.onerror = event => {
//         // console.log('数据写入失败...')
//       }
//     } else {
//       // console.log('此条数据已存在!')
//     }
//   }
// }

/**
  * 更新数据
  * @returns {String}
  * {String} dbName   数据库名称
  * {String} data     需要更新的数据
*/
export const $updateDBbase = (dbName, data) => {
  if (!db) return
  let request = db.transaction([dbName], 'readwrite').objectStore(dbName).put(data)
  request.onsuccess = event => {
    // console.log('数据更新成功!')
  }
  request.onerror = event => {
    // console.log('数据更新失败...')
  }
}

/**
  * 读取数据指定索引键的数据
  * @returns {String}
  * {String} dbName   数据库名称
  * {String} id       索引键
  * {String} data     需要读取的数据
*/
export const $readDBbase = (dbName, id, callback) => {
  if (!db) return
  let request = db.transaction([dbName]).objectStore(dbName).get(id)
  request.onerror = event => {
    // console.log('事务失败...')
  }
  request.onsuccess = event => {
    if (request.result) {
      callback(request.result)
    } else {
      callback(null)
      // console.log('未获得数据记录...')
    }
  }
}

/**
  * 读取数据指定索引键的数据
  * @returns {String}
  * {String} dbName   数据库名称
  * {String} id       索引键
  * {String} data     需要读取的数据
*/
export const $readIndexDBbase = (dbName, index, value, callback) => {
  if (!db) return
  let request = db.transaction([dbName]).objectStore(dbName).index(index).getAll(value)
  request.onerror = event => {
    // console.log('事务失败...')
  }
  request.onsuccess = event => {
    if (request.result) {
      callback(request.result)
    } else {
      callback(null)
      // console.log('未获得数据记录...')
    }
  }
}

/**
  * 获取数据库所有数据
  * @returns {String}
  * {String} dbName   数据库名称
*/
export const $getAllDBbase = dbName => {
  if (!db) return
  let request = db.transaction([dbName], 'readwrite').objectStore(dbName).getAll()
  request.onsuccess = event => {
    if (event.target && event.target.result && event.target.result.length > 0) {
      // console.log('获取全部数据成功！', event.target.result)
    }
  }
  request.onerror = event => {
    // console.log('获取全部数据失败...')
  }
}

/**
  * 删除数据
  * @returns {String}
  * {String} dbName   数据库名称
  * {String} id       索引键
*/
export const $removeDBbase = (dbName, id) => {
  if (!db) return
  let request = db.transaction([dbName], 'readwrite').objectStore(dbName).delete(id)
  request.onsuccess = event => {
    // console.log('数据删除成功!')
  }
  request.onerror = event => {
    // console.log('数据更新失败...')
  }
}

/**
  * 删除数据库
  * @returns {String}
  * {String} dbName   数据库名称
*/
export const $deleteDBbase = dbName => {
  // 关闭数据库
  db.close()
  // 删除数据库
  let request = window.indexedDB.deleteDatabase(dbName)
  request.onsuccess = event => {
    // console.log('数据库删除成功!')
  }
  request.onerror = event => {
    // console.log('数据库删除失败...')
  }
}

/**
  * 删除数据库所有内容
  * @returns {String}
  * {String} dbName   数据库名称
*/
export const $clearDBbase = dbName => {
  if (!db) return
  db.transaction([dbName], 'readwrite').objectStore(dbName).clear()
}
