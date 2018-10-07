/*
 * Reader.js
 * A unified reader interface for AJAX, local and File API access
 * 43081j
 * License: MIT, see LICENSE
 */

if (typeof require === 'function') {
  var fs = require('fs');
}

export enum SourceType {
  OPEN_FILE,
  OPEN_URI,
  OPEN_LOCAL
}

export class Reader {
  private _size = 0;
  private file: any = null;
  private fd: any;

  public get size() {
    return this._size;
  }

  constructor(public type = SourceType.OPEN_URI) {}

  public open(file: any) {
    this.file = file;
    return new Promise((resolve, reject) => {
      switch (this.type) {
        case SourceType.OPEN_LOCAL:
          fs.stat(this.file, (err: any, stat: any) => {
            if (err) {
              return reject(err);
            }
            this._size = stat.size;
            fs.open(this.file, 'r', (err: any, fd: any) => {
              if (err) {
                return reject(err);
              }
              this.fd = fd;
              resolve();
            });
          });
          break;
        case SourceType.OPEN_FILE:
          this._size = this.file.size;
          resolve();
          break;
        default:
          this.ajax(
            {
              uri: this.file,
              type: 'HEAD'
            },
            (err: any, resp: any, xhr: any) => {
              if (err) {
                return reject(err);
              }
              this._size = parseInt(xhr.getResponseHeader('Content-Length'));
              resolve();
            }
          );
          break;
      }
    });
  }

  public ajax(opts: { [id: string]: any }, callback: Function) {
    var options: { [id: string]: any } = {
      type: 'GET',
      uri: null,
      responseType: 'text'
    };
    if (typeof opts === 'string') {
      opts = { uri: opts };
    }
    for (var k in opts) {
      options[k] = opts[k];
    }
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      if (xhr.status !== 200 && xhr.status !== 206) {
        return callback('Received non-200/206 response (' + xhr.status + ')');
      }
      callback(null, xhr.response, xhr);
    };
    xhr.responseType = options.responseType;
    xhr.open(options.type, options.uri, true);
    if (options.range) {
      options.range = [].concat(options.range);
      if (options.range.length === 2) {
        xhr.setRequestHeader('Range', 'bytes=' + options.range[0] + '-' + options.range[1]);
      } else {
        xhr.setRequestHeader('Range', 'bytes=' + options.range[0]);
      }
    }
    xhr.send();
  }

  public close(): Promise<void> {
    if (this.type === SourceType.OPEN_LOCAL) {
      return new Promise((resolve, reject) => {
        fs.close(this.fd, (err: any) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        });
      });
    }
    return Promise.resolve();
  }

  public async read(length: number, position: number): Promise<ArrayBuffer> {
    if (this.type === SourceType.OPEN_LOCAL) {
      return await this.readLocal(length, position);
    } else if (this.type === SourceType.OPEN_FILE) {
      return await this.readFile(length, position);
    } else {
      return await this.readUri(length, position);
    }
  }

  private async readBlob(
    length: number,
    position: number,
    type: string = 'application/octet-stream'
  ) {
    let data: any = await this.read(length, position);
    return new Blob([data], { type: type });
  }

  /*
 * Local reader
 */
  private readLocal(length: number, position: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      var buffer = new Buffer(length);
      fs.read(this.fd, buffer, 0, length, position, function(
        err: any,
        bytesRead: number,
        buffer: Buffer
      ) {
        if (err) {
          return reject(err);
        }
        var ab = new ArrayBuffer(buffer.length),
          view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; i++) {
          view[i] = buffer[i];
        }
        resolve(ab);
      });
    });
  }

  /*
 * URL reader
 */

  private readUri(length: number, position: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      this.ajax(
        {
          uri: this.file,
          type: 'GET',
          responseType: 'arraybuffer',
          range: [position, position + length - 1]
        },
        (err: string, buffer: Buffer) => {
          if (err) {
            return reject(err);
          }
          return resolve(<any>buffer);
        }
      );
    });
  }

  /*
 * File API reader
 */
  private readFile(length: number, position: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      var slice = this.file.slice(position, position + length),
        fr = new FileReader();
      fr.onload = function(e) {
        resolve((<any>e.target).result);
      };
      fr.onerror = function(e) {
        reject('File read failed');
      };
      fr.readAsArrayBuffer(slice);
    });
  }
}
