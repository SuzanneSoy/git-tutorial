// for nodejs
if (typeof sha256 == 'undefined' && typeof require != 'undefined') { try { sha256 = require('./sha256.js').sha256; } catch (e) {console.log(e);} }

var micro_ipfs = (function() {
  var hexVarintToInteger = function(str) {
    var s = String(str);
    var total = 0;
    var offset = 1;
    for (var i = 0; i < s.length; i += 2) {
      var byte = parseInt(s.substring(i, i+2), 16);
      var isLast = null;
      if (byte >= 128) {
        byte -= 128;
        isLast = false;
      } else {
        isLast = true;
      }
      total += byte * offset;
      offset *= Math.pow(2,7);
    }
    return total;
  };
  
  var hexStringToIntegerList = function(str) {
    var s = String(str);
    var result = [];
    for (var i = 0; i < s.length; i+=2) {
      result[i/2] = parseInt(s.substring(i, i+2), 16);
    }
    return result;
  };
  
  var hexStringToString = function(str) {
    var s = String(str);
    var result = '';
    for (var i = 0; i < s.length; i+=2) {
      result += String.fromCharCode(parseInt(s.substring(i, i+2), 16));
    }
    return result;
  };
  
  var sha256IntegerListToMultihash = function(base, lst) {
    // 0x20 is the length of the hash.
    var i = 0;
    var result = [];
    if (base == 32) {
      // For some reason these are present in the base32 CIDs but not in the base16 CIDs
      result[i++] = parseInt('01', 16);
      result[i++] = parseInt('70', 16);
    }
    result[i++] = parseInt('12', 16);
    result[i++] = parseInt('20', 16);
    for (var j = 0; j < lst.length; j++) {
      result[j+i] = lst[j];
    }
    return result;
  };
  
  var integerListToLowercaseBase16Multibase = function(lst) {
    var result = '';
    for (var i = 0; i < lst.length; i++) {
      var hex = lst[i].toString(16);
      if (hex.length < 2) { hex = '0' + hex; }
      result += hex;
    }
    return 'f' + result;
  };
  
  var int8ListToBitList = function(lst) {
    var result = [];
    for (var i = 0; i < lst.length; i++) {
      result[i*8+0] = (lst[i] & 128) ? 1 : 0;
      result[i*8+1] = (lst[i] & 64) ? 1 : 0;
      result[i*8+2] = (lst[i] & 32) ? 1 : 0;
      result[i*8+3] = (lst[i] & 16) ? 1 : 0;
      result[i*8+4] = (lst[i] & 8) ? 1 : 0;
      result[i*8+5] = (lst[i] & 4) ? 1 : 0;
      result[i*8+6] = (lst[i] & 2) ? 1 : 0;
      result[i*8+7] = (lst[i] & 1) ? 1 : 0;
    }
    return result;
  };
  
  var base32StringToBitList = function(str) {
    var baseChars = 'abcdefghijklmnopqrstuvwxyz234567';
    var s = String(str);
    var result = [];
    for (var i = 0; i < s.length; i++) {
      var part = baseChars.indexOf(s[i]);
      //for (var j = 0; j < 6; j++) {
      //  result[i*6+j] = (part & Math.pow(2, 6-1-j)) ? 1 : 0;
      //}
      result[i*5+0] = (part & 16) ? 1 : 0;
      result[i*5+1] = (part & 8) ? 1 : 0;
      result[i*5+2] = (part & 4) ? 1 : 0;
      result[i*5+3] = (part & 2) ? 1 : 0;
      result[i*5+4] = (part & 1) ? 1 : 0;
    }
    return result;
  };
  
  // https://gist.github.com/diafygi/90a3e80ca1c2793220e5/, license: wtfpl
  var from_b58 = function(S,A){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)};
  
  var base58StringToHexString = function(str) {
    var baseChars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    var ints = from_b58(String(str), baseChars);
    var result = '';
    for (var i = 0; i < ints.length; i++) {
      var hex = ints[i].toString(16);
      if (hex.length < 2) { hex = '0' + hex; }
      result += hex;
    }
    return result;
  };
  
  var integerListToLowercaseBase32Multibase = function(lst) {
    var baseChars = 'abcdefghijklmnopqrstuvwxyz234567';
    var result = '';
    var l = int8ListToBitList(lst);
  
    for (var i = 0; i < l.length; i+= 5) {
      var get = function(j) { return ((i+j) < l.length) ? l[i+j] : 0; };
      var part = get(0) * 16 + get(1) * 8 + get(2) * 4 + get(3) * 2 + get(4) * 1;
      result += baseChars[part];
    }
    return 'b' + result;
  };
  
  var base32StringToBase16LowercaseMultibase = function(str) {
    var baseChars = '0123456789abcdef';
    var result = '';
    var l = base32StringToBitList(str);
  
    for (var i = 0; i < l.length; i+= 4) {
      var get = function(j) { return ((i+j) < l.length) ? l[i+j] : 0; };
      var part = get(0) * 8 + get(1) * 4 + get(2) * 2 + get(3) * 1;
      result += baseChars[part];
    }
    return 'f' + result;
  };
  
  var integerToHexVarint = function(i) {
    // This function takes a JavaScript integer and returns a hexadecimal string representing that integer encoded as a protobuf varint according to the rules explained at
    // https://developers.google.com/protocol-buffers/docs/encoding
    var result = '';
    if (i < 0) {
      throw "Negative integers are supported by Varints but not by this implementation.";
    } else if (i == 0) {
      return '00';
    } else {
      while (i > 0) {
        // Get the least significant 7 bits (0..127) of the integer and shift the rest
        var leastSignificantBits = i & 127;
        i = i >> 7;
        // if this is not the last chunk, set the most significant bit to indicate that the value will be continued in the next byte(s).
        if (i > 0) { leastSignificantBits |= 128; }
        // Convert to hexadecimal and pad with 0 to get two digits if needed
        var hex = leastSignificantBits.toString(16);
        if (hex.length < 2) { hex = '0' + hex; }
        result += hex;
      }
      return result;
    }
  }
  
  var utf8StringToHex = function(str) {
    // The input must already be a string for which .charCodeAt() always returns a value <256 (i.e. a string encoded into utf-8 and those values re-encoded into javascript's internal utf-16)
    var s = String(str);
    var result = '';
    for (var i = 0; i < s.length; i++) {
      var hex = s.charCodeAt(i).toString(16);
      if (hex.length < 2) { hex = '0' + hex; }
      result += hex;
    }
    return result;
  };
  
  var ipfsBlockWithLinks = function(object) {
    // object should be an { "Links": links, "Data": hex-encoded string } object
    // Aside from encoding differences, it should match the contents of the "ipfs object get --data-encoding=base64 Qm…hash" command
    //
    // "Links" should be an array of { 'Hash': cidv1Base16Lowercase, 'Size': Integer } objects.
    // This functions returns a hexadecimal string which encodes the ipfs block with the given links.
    // This is a partial implementation which is barely sufficient for re-hashing a file, many of the configurable values are hardcoded.
    // A Qm…hash can be converted to a "CIDv1 base16 lowercase" hash on the command-line using the following code:
    //   ipfs cid format -v 1 -b base16 -f='%m' Qm…hash
    //
    // "File" should be the hex-encoded (base 16, lowercase, no prefix) data, or "false" when the entry is not a DAG leaf
    //
    // The "Data" field as given by the following command
    //   ipfs object get --data-encoding=base64 Qm…hash | jq -r '.Data' | base64 -d | xxd -ps
    // is automatically generated using the "File" field if present and the various sizes etc.
  
    var links = object.Links;
    var fileHex = object.File;
    var result = '';
  
    for (var i = 0; i < links.length; i++) {
      var cid = links[i].Hash;
      var size = links[i].Size;
      var name = links[i].Name;
      var fileHex = object.File;
  
      result += '12';
  
      var encodedLink = ''
      // Some sort of separator or terminator
      encodedLink += '0a';
  
      // size of the CID (32 bytes + 2 bytes header = 34 bytes = 22 in hex)
      encodedLink += '22';
  
      if (cid[0] != 'f' || cid.length != 69) {
        if (cid[0] == 'Q' && cid[1] == 'm' && cid.length == 46) {
          cid = 'f' + base58StringToHexString(cid);
          if (cid[0] != 'f' || cid.length != 69) {
            throw "Internal error";
          }
        } else {
          throw "Expected a lowercase base16 CIDv1 or a Qm…hash in base58 (length 46). The base16 encoding should start with 'f'" +
          /*+*/ " and have a length of 32 bytes (64 hexadecimal characters) plus the leading prefix 'f1220' (length of 69 characters in total)" +
          /*+*/ " as described in https://github.com/multiformats/multibase. The given hash started with " + cid[0] + " and had a length of " + cid.length;
        }
      }
  
      // Add the CID.
      encodedLink += cid.substring(1);
  
      // Add a second hardcoded part of the encoding.
      encodedLink += '12';
      // length of filename
      encodedLink += integerToHexVarint(name.length);
      encodedLink += utf8StringToHex(name);
  
      encodedLink += '18';
  
      // Add the size.
      encodedLink += integerToHexVarint(size);
  
      var encodedLinkSize = encodedLink.length/2
      result += integerToHexVarint(encodedLinkSize);
      result += encodedLink;
    }
  
    // Generate the "Data" field
  
    var totalSize = (fileHex || '').length / 2;
    for (var i = 0; i < object.Links.length; i++) {
      totalSize += object.Links[i].ContentSize;
    }
  
    var encodedData = '';
    if (object.isFile) {
      //             '08'   '02'
      encodedData += '08' + '02';
      // field 12 seems to be optional (for DAG nodes with links (groups of blocks and directories))
      if (fileHex !== false) {
        encodedData += '12';
        encodedData += integerToHexVarint(totalSize);
        encodedData += fileHex;
      }
      //            '18' [8f b0 15 = total size of contents of the file = 35022300]
      encodedData += '18' + integerToHexVarint(totalSize);
      for (var j = 0; j < object.Links.length; j++) {
        // 20 [80 80 10 = size of contents of block 1 = 262144]
        // 20 [8f b0 05 = size of contents of block 2 = 88079]
        encodedData += '20';
        encodedData += integerToHexVarint(object.Links[j].ContentSize);
      }
    } else {
      // directory
      encodedData += '08' + '01';
    }
  
    // Some sort of separator or terminator
    result += '0a';
    var encodedDataSize = encodedData.length / 2;
    result += integerToHexVarint(encodedDataSize);
    result += encodedData;
  
    return result;
  };
  
  var ipfsHashWithLinks = function(base, object) {
    var block = hexStringToIntegerList(ipfsBlockWithLinks(object));
    //console.time('sha256');
    var sha = sha256(block);
    //console.timeEnd('sha256');
    var hash = sha256IntegerListToMultihash(base, sha);
    if (base == 16) {
      return { "hash" : integerListToLowercaseBase16Multibase(hash), "block" : block };
    } else {
      return { "hash" : integerListToLowercaseBase32Multibase(hash), "block" : block };
    }
  };

  return {
    utf8StringToHex: utf8StringToHex,
    hashWithLinks: ipfsHashWithLinks
  };
})();

var ipfs_self_hash = (function() {
    var ipfs = micro_ipfs;
    var get_root_with_vanity = function(vanity_attempt, ipfs_directory_hashes) {
      var find_link_entry = function() {
        for (var i = 0; i < ipfs_directory_hashes.tree.Links.length; i++) {
          if (ipfs_directory_hashes.tree.Links[i].Name == 'directory_hashes.js') {
            return i;
          }
        }
        console.error(ipfs_directory_hashes);
        console.error(ipfs_directory_hashes.tree.Links);
        throw "Could not find entry for directory_hashes.js";
      }
      var foo_link_entry = find_link_entry();
      ipfs_directory_hashes.tree.Links[foo_link_entry].Hash = "";
      ipfs_directory_hashes.tree.Links[foo_link_entry].Size = 0;
      ipfs_directory_hashes.vanity_number = vanity_attempt;
  
      // TODO: using JSON.stringify to recreate the file is more brittle, better store the stringified version as a hex string, and then decode it?
      var file_directory_hashes = 'jsonp_ipfs_directory_hashes(' + JSON.stringify(ipfs_directory_hashes) + ');\n';
      var foo = ipfs.hashWithLinks(16, {
        "Links": [],
        "isFile": true,
        "File": ipfs.utf8StringToHex(file_directory_hashes)
      });
  
      ipfs_directory_hashes.tree.Links[foo_link_entry].Hash = foo.hash;
      ipfs_directory_hashes.tree.Links[foo_link_entry].Size = foo.block.length;
  
      root = ipfs.hashWithLinks(32, ipfs_directory_hashes.tree);
      return root;
    };
  
    var expected_vanity_attempt = 32*32*32;
    var max_vanity_attempt = expected_vanity_attempt*10;
    function find_vanity_node(vanity_text, vanity_attempt, ipfs_directory_hashes) {
      if ((! (typeof vanity_text == 'string' || vanity_text instanceof String)) || vanity_text.length != 3) {
        throw 'find_vanity_node(vanity_text, ...) : expected a string of length 3';
      }
      var offset = 1;
      switch (vanity_text[2]) {
        case '4':
        case 'a':
        case 'e':
        case 'i':
        case 'm':
        case 'q':
        case 'u':
        case 'y':
          offset = 0;
      }
      while (true) {
        if (vanity_attempt > max_vanity_attempt) {
          // give up:
          throw 'Failed to brute-force a number that generates the desired vanity text.';
        } else {
          var root = get_root_with_vanity(vanity_attempt, ipfs_directory_hashes);
          if (root.hash[root.hash.length-1-offset] == vanity_text[2] && root.hash[root.hash.length-2-offset] == vanity_text[1]) {
            console.error(vanity_attempt + ' (' + Math.floor(100*vanity_attempt/expected_vanity_attempt) + '%)');
            if (root.hash[root.hash.length-3-offset] == vanity_text[0]) {
              return vanity_attempt;
            }
          }
          vanity_attempt++;
        }
      }
    };

    function find_vanity_browser_(offset, old_root, vanity_text, vanity_attempt, callback, ipfs_directory_hashes) {
      var root = get_root_with_vanity(vanity_attempt, ipfs_directory_hashes);
      if (vanity_attempt > max_vanity_attempt) {
        // give up:
        root = get_root_with_vanity(ipfs_directory_hashes.vanity_number, ipfs_directory_hashes)
        callback(root, 'timeout', false);
      } else {
        if (root.hash[root.hash.length-1-offset] == vanity_text[2]) {
          callback(old_root, '… ' + vanity_attempt + ' (' + Math.floor(100*vanity_attempt/expected_vanity_attempt) + '%)', false);
          if (root.hash[root.hash.length-2-offset] == vanity_text[1] && root.hash[root.hash.length-3-offset] == vanity_text[0]) {
            callback(root, vanity_attempt, true);
          } else {
            window.setTimeout(function() { find_vanity_browser_(offset, old_root, vanity_text, vanity_attempt + 1, callback, ipfs_directory_hashes); }, 0);
          }
        } else {
          window.setTimeout(function() { find_vanity_browser_(offset, old_root, vanity_text, vanity_attempt + 1, callback, ipfs_directory_hashes); }, 0);
        }
      }
    };

    var find_vanity_browser = function(old_root, vanity_text, vanity_attempt, callback, ipfs_directory_hashes) {
      if ((! (typeof vanity_text == 'string' || vanity_text instanceof String)) || vanity_text.length != 3) {
        throw 'find_vanity_node(vanity_text, ...) : expected a string of length 3';
      }
      var offset = 1;
      switch (vanity_text[2]) {
        case '4':
        case 'a':
        case 'e':
        case 'i':
        case 'm':
        case 'q':
        case 'u':
        case 'y':
          offset = 0;
      }
      return find_vanity_browser(offset, old_root, vanity_text, vanity_attempt, callback, ipfs_directory_hashes)
    };
  
    var debug = function(show_link) {
      var root = get_root_with_vanity(ipfs_directory_hashes.vanity_number, ipfs_directory_hashes);
      var vanity_text = ipfs_directory_hashes.vanity_text;
  
      if (root.hash[root.hash.length-1] == vanity_text[2] && root.hash[root.hash.length-2] == vanity_text[1] && root.hash[root.hash.length-3] == vanity_text[0]) {
        // vanity check is ok
        show_link(root, ipfs_directory_hashes.vanity_number, true);
      } else {
        // Brute-force to try to find a number that gives the desired last 3 characters
        show_link(root, '…', false);
        find_vanity_browser(root, vanity_text, 0, show_link, ipfs_directory_hashes);
      }
    };

    var get_link = function get_link() {
      var root = get_root_with_vanity(ipfs_directory_hashes.vanity_number, ipfs_directory_hashes);
      return root.hash;
    };
    
    return { get_link: get_link, find_vanity_browser: find_vanity_browser, find_vanity_node: find_vanity_node };
  })();

  function jsonp_ipfs_directory_hashes(arg) {
    ipfs_directory_hashes = arg;
  }

  if (typeof module != 'undefined') { module.exports = { micro_ipfs : micro_ipfs, ipfs_self_hash : ipfs_self_hash }; }