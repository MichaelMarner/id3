import { ID3Tag } from './id3tag';
import { Reader, SourceType } from './reader';

export async function id3(opts: any, cb: Function) {
  /*
   * Initialise ID3
   */
  var options: any = {
    type: SourceType.OPEN_URI,
  };
  if (typeof opts === 'string') {
    opts = {
      file: opts,
      type: SourceType.OPEN_URI
    };
  } else if (typeof window !== 'undefined' && (<any>window).File && opts instanceof (window as any).File) {
    opts = {
      file: opts,
      type: SourceType.OPEN_FILE
    };
  }
  for (var k in opts) {
    options[k] = opts[k];
  }

  if (!options.file) {
    return cb('No file was set');
  }

  if (options.type === SourceType.OPEN_FILE) {
    if (typeof window === 'undefined' || !(window as any).File || !(window as any).FileReader || typeof ArrayBuffer === 'undefined') {
      return cb('Browser does not have support for the File API and/or ArrayBuffers');
    }
  } else if (options.type === SourceType.OPEN_LOCAL) {
    if (typeof require !== 'function') {
      return cb('Local paths may not be read within a browser');
    }
  } else {}
  var handle = new Reader(options.type);

  try {
    await handle.open(options.file);
    ID3Tag.parse(handle, function (err: any, tags: Object) {
      cb(err, tags);
      // we are not actually worried if close fails
      handle.close();
    });
  }
  catch (err) {
    return cb('Could not open specified file');
  }
};
