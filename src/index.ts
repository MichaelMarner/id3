import { ID3Exception } from './id3-exception';
import { ID3Tag } from './id3tag';
import { Reader, SourceType } from './reader';

export async function id3(opts: any) {
  /*
   * Initialise ID3
   */
  var options: any = {
    type: SourceType.OPEN_URI
  };
  if (typeof opts === 'string') {
    opts = {
      file: opts,
      type: SourceType.OPEN_URI
    };
  } else if (
    typeof window !== 'undefined' &&
    (<any>window).File &&
    opts instanceof (window as any).File
  ) {
    opts = {
      file: opts,
      type: SourceType.OPEN_FILE
    };
  }
  for (var k in opts) {
    options[k] = opts[k];
  }

  if (!options.file) {
  }

  if (options.type === SourceType.OPEN_FILE) {
    if (
      typeof window === 'undefined' ||
      !(window as any).File ||
      !(window as any).FileReader ||
      typeof ArrayBuffer === 'undefined'
    ) {
      throw new ID3Exception('Browser does not have support for the File API and/or ArrayBuffers');
    }
  } else if (options.type === SourceType.OPEN_LOCAL) {
    if (typeof require !== 'function') {
      throw new ID3Exception('Local paths may not be read within a browser');
    }
  } else {
  }
  var handle = new Reader(options.type);

  await handle.open(options.file);
  let tags = await ID3Tag.parse(handle);
  handle.close();
  return tags;
}
