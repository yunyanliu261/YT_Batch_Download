const fs = require('fs');
const path = require('path');

const pad = (n) => String(n).padStart(2, '0');

// Local time as "2026-10-27 20:30:01"
const formatTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// Local time as "20261027-203001", used for log file names
const fileStamp = (d) => formatTime(d).replace(/-/g, '').replace(' ', '-').replace(/:/g, '');

/**
 * Log of one download run. Lines written before the target folder is known are buffered,
 * then everything goes to <dir>/<timestamp>.log once open() is called.
 */
const createRunLog = (startedAt = new Date()) => {
  const buffer = [];
  let stream = null;
  let filePath = null;
  let closed = false;

  return {
    write(line) {
      if (closed) return;
      const entry = `[${formatTime(new Date())}] ${line}\n`;
      if (stream) stream.write(entry);
      else buffer.push(entry);
    },
    // Start writing to a file in dir; returns the file path
    open(dir) {
      if (stream || closed) return filePath;
      fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, `${fileStamp(startedAt)}.log`);
      stream = fs.createWriteStream(filePath, { flags: 'a' });
      stream.write(buffer.join(''));
      buffer.length = 0;
      return filePath;
    },
    // Finish the file; calls cb once everything is flushed
    close(cb) {
      if (closed) return cb && cb();
      closed = true;
      if (stream) stream.end(cb);
      else if (cb) cb();
    },
    get path() {
      return filePath;
    },
  };
};

module.exports = { createRunLog, formatTime, fileStamp };
