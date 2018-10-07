/*
 * dataview-extra.js
 * 43081j
 * License: MIT, see LICENSE
 */
export class EnhancedDataView extends DataView {
  getString(length?: number, offset = 0, raw?: boolean) {
    length = length || this.byteLength - offset;
    if (length < 0) {
      length += this.byteLength;
    }
    var str = '';
    if (typeof Buffer !== 'undefined') {
      var data = [];
      for (var i = offset; i < offset + length; i++) {
        data.push(this.getUint8(i));
      }
      return new Buffer(data).toString();
    } else {
      for (var i = offset; i < offset + length; i++) {
        str += String.fromCharCode(this.getUint8(i));
      }
      if (raw) {
        return str;
      }
      return decodeURIComponent(escape(str));
    }
  }

  getStringUtf16(length: number, offset: number, bom?: any) {
    offset = offset || 0;
    length = length || this.byteLength - offset;
    var littleEndian = false,
      str: any = '',
      useBuffer = false;
    if (typeof Buffer !== 'undefined') {
      str = [];
      useBuffer = true;
    }
    if (length < 0) {
      length += this.byteLength;
    }
    if (bom) {
      var bomInt = this.getUint16(offset);
      if (bomInt === 0xfffe) {
        littleEndian = true;
      }
      offset += 2;
      length -= 2;
    }
    for (var i = offset; i < offset + length; i += 2) {
      var ch = this.getUint16(i, littleEndian);
      if ((ch >= 0 && ch <= 0xd7ff) || (ch >= 0xe000 && ch <= 0xffff)) {
        if (useBuffer) {
          str.push(ch);
        } else {
          str += String.fromCharCode(ch);
        }
      } else if (ch >= 0x10000 && ch <= 0x10ffff) {
        ch -= 0x10000;
        if (useBuffer) {
          str.push(((0xffc00 & ch) >> 10) + 0xd800);
          str.push((0x3ff & ch) + 0xdc00);
        } else {
          str +=
            String.fromCharCode(((0xffc00 & ch) >> 10) + 0xd800) +
            String.fromCharCode((0x3ff & ch) + 0xdc00);
        }
      }
    }
    if (useBuffer) {
      return new Buffer(str).toString();
    } else {
      return decodeURIComponent(escape(str));
    }
  }

  getSynch(num: number) {
    var out = 0,
      mask = 0x7f000000;
    while (mask) {
      out >>= 1;
      out |= num & mask;
      mask >>= 8;
    }
    return out;
  }

  getUint8Synch(offset: number) {
    return this.getSynch(this.getUint8(offset));
  }

  getUint32Synch(offset: number) {
    return this.getSynch(this.getUint32(offset));
  }

  /*
 * Not really an int as such, but named for consistency
 */
  getUint24(offset: number, littleEndian?: boolean) {
    if (littleEndian) {
      return (
        this.getUint8(offset) + (this.getUint8(offset + 1) << 8) + (this.getUint8(offset + 2) << 16)
      );
    }
    return (
      this.getUint8(offset + 2) + (this.getUint8(offset + 1) << 8) + (this.getUint8(offset) << 16)
    );
  }
}
