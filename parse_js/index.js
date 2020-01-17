'use strict'

var YEAR = '2020'
var LABELS = ['燃やすごみ', '蛍光灯・乾電池', '燃やさないごみ', 'かん', 'びん', 'ペットボトル・衣類', '紙類', '剪定枝・草']
var LABEL_CONVERT = {
  '乾電池': '蛍光灯・乾電池',
  '衣類': 'ペットボトル・衣類',
  '剪定枝': '剪定枝・草',
  'かん類': 'かん',
  '蛍光灯': '蛍光灯・乾電池',
  'びん類': 'びん',
  'ペットボトル': 'ペットボトル・衣類'
}

var checkFiles = function (e) {
  e.preventDefault()
  var data = document.getElementById('data').files[0]
  var calendar = document.getElementById('calendar').files[0]
  if (!data || !calendar) {
    resetResults()
    addResults('データを指定してください')
    return
  }

  parseData(data, function (csv) {
    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    var blob = new Blob([bom, csv], {"type": "text/csv"});
    var link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob);
    link.textContent = 'target.csv'
    link.download = 'target.csv'
    addResults(link)
  })
  parseCalendar(calendar, function (csv) {
    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    var blob = new Blob([bom, csv], {"type": "text/csv"});
    var link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob);
    link.textContent = 'area_days.csv'
    link.download = 'area_days.csv'
    addResults(link)
  })
}

var parseData = function (dataFile, callback) {
  Papa.parse(dataFile, {
    encoding: 'shift-jis',
    header: true,
    error: function () {
    },
    complete: function (results, file) {
      var LABEL = '区分', NAME = 'ごみの種類', NOTICE = '収集に出す際の条件等', FURIGANA = '音'
      var targets = []
      results.data.forEach(function (values) {
        var data = []
        var label = values[LABEL]
        if (!LABELS.includes(label)) {
          if (LABEL_CONVERT[label]) {
            label = LABEL_CONVERT[label]
          } else {
            console.warn('Not defined type: ' + label)
          }
        }
        data.push(label)
        data.push(values[NAME])
        data.push(values[NOTICE])
        data.push(values[FURIGANA])
        targets.push(data)
      })
      var csv = Papa.unparse({
        fields: ['label', 'name', 'notice', 'furigana'],
        data: targets
      })
      callback(csv)
    }
  })
}

var parseCalendar = function (calendarFile, callback) {
  var parseDate = function (str) {
    if (!str) return ''
    if (str.indexOf('毎週') !== -1) {
      return str.replace(/・/g, ' ').replace('毎週', '')
    } else {
      var dates = str.split('、').map(function (dates) {
        var hankakuDate = dates.replace(/[！-～]/g, function (s) {
          return String.fromCharCode(s.charCodeAt(0) - 65248);
        });
        return moment(YEAR + '/' + hankakuDate, 'YYYY/M/D').format('YYYYMMDD')
      })
      return dates.join(' ')
    }
  }
  Papa.parse(calendarFile, {
    encoding: 'shift-jis',
    header: true,
    error: function () {
    },
    complete: function (results, file) {
      var NAME = '町名',
        TYPE1 = '燃やすごみ',
        TYPE2 = '蛍光灯・乾電池',
        TYPE3 = '燃やさないごみ',
        TYPE4 = 'かん',
        TYPE5 = 'びん',
        TYPE6 = '剪定枝・草',
        TYPE7 = 'ペットボトル・衣類',
        TYPE8 = '紙類'
      var targets = []
      results.data.forEach(function (values) {
        var data = []
        data.push(values[NAME])
        data.push('')
        data.push(parseDate(values[TYPE1]))
        data.push(parseDate(values[TYPE2]))
        data.push(parseDate(values[TYPE3]))
        data.push(parseDate(values[TYPE4]))
        data.push(parseDate(values[TYPE5]))
        data.push(parseDate(values[TYPE6]))
        data.push(parseDate(values[TYPE7]))
        data.push(parseDate(values[TYPE8]))
        targets.push(data)
      })
      var csv = Papa.unparse({
        fields: ['地名', 'センター（center.csvを使わない場合は空白化）', '燃やすごみ', '蛍光灯・乾電池', '燃やさないごみ', 'かん', 'びん', '剪定枝・草', 'ペットボトル・衣類', '紙類'],
        data: targets
      })
      callback(csv)
    }
  })
}

var resetResults = function () {
  document.getElementById('results').innerHTML = ''
}

var addResults = function (text) {
  var div = document.createElement('div')
  if (typeof text === 'string') {
    div.textContent = text
  } else {
    div.appendChild(text)
  }
  document.getElementById('results').appendChild(div)
};

(function () {
  document.getElementById('submit').addEventListener('click', checkFiles)
})()