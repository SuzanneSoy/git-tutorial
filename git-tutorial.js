function ___stringToUint8Array(s) {
  var s = ""+s;
  var a = [];
  for (var i = 0; i < s.length; i++) {
    a.push(s.charCodeAt(i));
  }
  return new Uint8Array(a);
}
function ___uint8ArrayToString(a) {
  var s = [];
  for (var i = 0; i < a.length; i++) {
    s.push(String.fromCharCode(a[i]));
  }
  return s.join('');
}
function ___to_hex(s) {
  var s = String(s);
  var hex = ""
  for (var i = 0; i < s.length; i++) {
    hex += ___left_pad(s.charCodeAt(i).toString(16), '0', 2);
  }
  return hex;
}

function ___hex_to_bin(hex) {
  var hex = String(hex);
  var str = ""
  for (var i = 0; i < hex.length; i+=2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

// These three functions are accessible in the user scripts.
sha1 = function(s) { return Sha1.hash(___to_hex(s), { msgFormat: 'hex-bytes', outFormat: 'hex' }); };
deflate = function(s) { return ___uint8ArrayToString(pako.deflate(___stringToUint8Array(s))); }
inflate = function(s) { return ___uint8ArrayToString(pako.inflate(___stringToUint8Array(s))); }

var ___global_unique_id = 0
function ___specialchars(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function ___left_pad(s, char, len) {
  var s = ""+s;
  while (s.length < len) { s = char + s; }
  return s;
}
function ___to_hex_for_printf(s) {
  var s = String(s);
  var hex = ""
  for (var i = 0; i < s.length; i++) {
    var h = ___left_pad(s.charCodeAt(i).toString(16), '0', 2);
    hex += '<span class="hex-prefix">\\x<span class="hex">' + h + '</span></span>';
  }
  return '<span style="display: block;">' + hex + '</span>';
}
function ___specialchars_and_colour(s) {
  return s.replace(/[^-a-zA-Z0-9+_/!%$@.()':]/g, function (c) {
        switch (c) {
          case " ":  return '<span class="space"> </span>'; break;
          case "\\": return '<span class="specialchar">\\\\</span>'; break;
          case "\0": return '<span class="specialchar newline">\\000</span>'; break;
          case "\r": return '<span class="specialchar">\\r</span>'; break;
          case "\n": return '<span class="specialchar newline">\\n</span>'; break;
          case "\t": return '<span class="specialchar">\\t</span>'; break;
          case '&':  return '&amp;'; break;
          case '<':  return '&lt;'; break;
          case '>':  return '&gt;'; break;
          case '"':  return '&quot;'; break;
          case "'":  return '&#39;'; break;
          default:   return '<span class="specialchar">\\x'+___left_pad(c.charCodeAt(0).toString(16), 0, 2)+'</span>'; break;
        }
      });
}
function ___getOffset(elt) {
  if (elt) {
      var o = ___getOffset(elt.offsetParent);
      return { left: elt.offsetLeft + o.left, top: elt.offsetTop + o.top };
  } else {
      return { left: 0, top: 0 };
  }
}
var global_current_hilite = { src: false, dests: [], srcid: false, destclass: false, lines: false };
function ___hilite_off() {
  if (global_current_hilite.src) {
    global_current_hilite.src.classList.remove('hilite-src');
  }
  for (var d = 0; d < global_current_hilite.dests.length; d++) {
    global_current_hilite.dests[d].classList.remove('hilite-dest');
  }
  if (global_current_hilite.lines) {
    global_current_hilite.lines.innerHTML = '';
  }
  global_current_hilite = { src: false, dests: [], srcid: false, destclass: false, lines: false };
}
function ___scroll_to_dest(srcid, destclass) {
  var src = document.getElementById(srcid);
  var wrapper = src;
  while (wrapper && !wrapper.classList.contains('hilite-wrapper')) { wrapper = wrapper.parentElement; }
  var dests = (wrapper || document).getElementsByClassName(destclass);
  if (dests.length > 0) {
    dest = dests[dests.length - 1];
    while (dest && dest.tagName.toLowerCase() != 'tr') { dest = dest.parentElement; }
    if (dest) {
      dest.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dest.classList.add('scroll-destination-hilite');
      window.setTimeout(function() {
        dest.classList.add('scroll-destination-lolite');
        dest.classList.remove('scroll-destination-hilite');
        window.setTimeout(function() {
          dest.classList.remove('scroll-destination-lolite');
        }, 600);
      }, 1100);
    }
  }
  return false;
}
function ___hilite(srcid, destclass) {
  ___hilite_off();
  var src = document.getElementById(srcid);
  var wrapper = src;
  while (wrapper && !wrapper.classList.contains('hilite-wrapper')) { wrapper = wrapper.parentElement; }
  var dests = (wrapper || document).getElementsByClassName(destclass);

  // circumvent glitch where the codemirror areas seem to resize themselves
  // which causes the arrow to be misaligned. Instead of using a global container for lines:
  //    var lines = document.getElementById('lines');
  // we use a different container for each hilite-wrapper, positionned within it.
  var lines = wrapper.getElementsByClassName('lines');
  if (lines.length < 1) {
    lines = document.createElement('div');
    lines.className = 'lines';
    wrapper.insertBefore(lines, wrapper.firstChild);
  } else {
    lines = lines[0];
  }

  global_current_hilite = { src: src, dests: dests, srcid: srcid, destclass: destclass, lines: lines };

  src.classList.add('hilite-src');
  src.setAttribute('onclick', 'event.stopPropagation(); ___scroll_to_dest("'+srcid+'", "'+destclass+'")');
  lines.innerHTML = '';
  for (var d = 0; d < dests.length; d++) {
    dests[d].classList.add('hilite-dest');
    var osrc = ___getOffset(src);
    var tr = dests[d];
    while (tr !== null && tr.tagName.toLowerCase() != 'tr') { tr = tr.parentElement; }
    var otr = ___getOffset(tr);

    var l1 = document.createElement('div');
    lines.appendChild(l1);
    l1.style.position = 'absolute';

    var l2 = document.createElement('div');
    lines.appendChild(l2);
    l2.style.position = 'absolute';
    
    var l3 = document.createElement('div');
    lines.appendChild(l3);
    l3.style.position = 'absolute';

    var ar = document.createElement('div');
    lines.appendChild(ar);
    ar.style.position = 'absolute';

    var op = ___getOffset(l1.offsetParent);

    var arrowWidth = 15;
    var arrowHeight = 8;
    var thickness = 3;

    var xa = Math.floor(osrc.left - op.left + src.offsetWidth);
    var ya = Math.floor(osrc.top  - op.top  + src.offsetHeight / 2);
    var xb = Math.floor(otr.left - op.left + tr.offsetWidth);
    var yb = Math.floor(otr.top  - op.top  + tr.offsetHeight / 2);
    var pdest = { left: xb, top: yb };
    xb += arrowWidth - 1;
    var x = Math.max(xa, xb) + (50 * (d+1));
    if (ya > yb) {
      var tmpx = xa;
      var tmpy = ya;
      xa = xb;
      ya = yb;
      xb = tmpx;
      yb = tmpy;
    }

    var p1 = { left: xa, top: ya };
    var p2 = { left: x, top: ya };
    var p3 = { left: x, top: yb };
    var p4 = { left: xb, top: yb };

    // line 1
    l1.style.width = p2.left-p1.left;
    l1.style.height = thickness + 'px';
    l1.style.backgroundColor = 'red';
    l1.style.top  = p1.top;
    l1.style.left = p1.left;
    // line 2
    l2.style.width = thickness + 'px';
    l2.style.height = p3.top-p2.top + thickness;
    l2.style.backgroundColor = 'red';
    l2.style.top  = p2.top;
    l2.style.left = p2.left;
    // line 3
    l3.style.width = (p3.left-p4.left)+'px';
    l3.style.height = thickness+'px';
    l3.style.backgroundColor = 'red';
    l3.style.top  = p4.top+'px';
    l3.style.left = p4.left+'px';
    // arrow
    ar.style.width = '0px';
    ar.style.height = '0px';
    ar.style.borderLeft = arrowWidth+'px solid transparent';
    ar.style.borderTop = arrowHeight+'px solid transparent';
    ar.style.borderRight = arrowWidth+'px solid red';
    ar.style.borderBottom = arrowHeight+'px solid transparent';
    ar.style.top  = (pdest.top - arrowHeight + thickness/2)+'px';
    ar.style.left = (pdest.left - arrowWidth)+'px';
  }
}
function ___lolite(src, dest) {
  // For now, keep the highlight onmouseout, to help with scrolling while looking for the target of an arrow.
}
(function() {
  var oldresize = window.onresize;
  window.onresize = function () {
    if (global_current_hilite.srcid && global_current_hilite.destclass) {
      var srcid = global_current_hilite.srcid;
      var destclass = global_current_hilite.destclass;
      ___hilite(srcid, destclass);
    }
    if (oldresize) { oldresize(); }
  }
})();
function ___hex_hash(s) {
  var id = ___global_unique_id++;
  var hash = "object-hash-"+___to_hex(s.substr(0,20));
  return '<span id="'+id+'" class="hex-hash" onmouseover="___hilite('+id+',\''+hash+'\')" onmouseout="___lolite('+id+',\''+hash+'\')">'
            + ___to_hex_for_printf(s.substr(0,10))
            + ___to_hex_for_printf(s.substr(10,10))
            + '</span>'
            + ___specialchars_and_colour(s.substr(20) /* should be empty unless there's a bug */);
}
function ___specialchars_and_colour_and_hex(s) {
  if (s.substr(0,5) == "tree ") {
    var sp = s.split('\0');
    sp[0] = ___specialchars_and_colour(sp[0]);
    sp[1] = ___specialchars_and_colour(sp[1]);
    for (i = 2; i < sp.length; i++) {
      sp[i] = ___hex_hash(sp[i].substr(0,20))
            + ___specialchars_and_colour(sp[i].substr(20));
    }
    return sp.join('<span class="specialchar newline">\\000</span>');
  } else if (/^[0-9a-f]{40}\n$/.test(s)) {
    var id=___global_unique_id++;
    var hash = "object-hash-"+s.substr(0,40);
    return '<span id="'+id+'" class="plain-hash-or-ref" onmouseover="___hilite('+id+',\''+hash+'\')" onmouseout="___lolite('+id+',\''+hash+'\')">'
            + s.substr(0,40)
            + '</span>'
            + ___specialchars_and_colour(s.substr(40));
  } else if (/^ref: refs\/[^\n]*\n$/.test(s)) {
    var id=___global_unique_id++;
    var hash = "object-hash-"+s.substr(5, s.length-6);
    return s.substr(0,5)
           + '<span id="'+id+'" class="plain-hash-or-ref" onmouseover="___hilite('+id+',\''+hash+'\')" onmouseout="___lolite('+id+',\''+hash+'\')">'
           + ___specialchars_and_colour(s.substr(5, s.length-6))
           + '</span>'
           + ___specialchars_and_colour(s.substr(s.length-1));
  } else if(s.substr(0,4) == "DIRC") {
    var html = 'DIRC'; // magic
    var i = 4;
    var binary_span = function(bits) {
      var bytes = bits / 8;
      html += '<span class="newline">' + ___to_hex_for_printf(s.substr(i, bytes)) + '</span>';
      i += bytes;
    }
    binary_span(32); // version
    binary_span(32); // entries

    var entry_start = i;
    while (i + 20 < s.length) {
      binary_span(64); // ctime
      binary_span(64); // mtime
      binary_span(32); // device
      binary_span(32); // inode
      binary_span(32); // mode (stored as octal → binary)
      binary_span(32); // uid
      binary_span(32); // gid
      binary_span(32); // size
      html += ___hex_hash(s.substr(i, 20)); // hash
      i += 20;
      var length = s.substr(i, 2);
      length = length.charCodeAt(0) * 256 + length.charCodeAt(1);
      length &= 0xfff;
      binary_span(16); // 4 bits flags, 12 bits file length
      // file path until null
      html += ___specialchars_and_colour(s.substr(i, length));
      i += length;
      while (i < s.length && (i - entry_start) % 8 != 0) {
        // null bytes
        if (s.charCodeAt(i) == 0) {
          // as expected
          html += '<span class="specialchar">\\000</span>';
        } else {
          // there's a bug in this git index, display the hex chars as they come.
          html += ___specialchars_and_colour(s.substr(i, 1));
        }
        i++;
      }
      entry_start = i;
    }

    html += ___hex_hash(s.substr(i, 20)); // hash
    i += 20;

    html += ___specialchars_and_colour(s.substr(i)); // should be empty

    return html;
  } else if(s.substr(0,7) == "commit ") {
    var sz = s.split('\0');
    var sp = sz[1].split('\n');
    sz[0] = ___specialchars_and_colour(sz[0]);
    var i;
    for (i = 0; i < sp.length && sp[i] != ''; i++) {
      if (/(tree|parent) [0-9a-f]{40}/.test(sp[i])) {
        var prefix_len = sp[i].startsWith('tree ') ? 5 : 7;
        var id=___global_unique_id++;
        var hash = "object-hash-"+sp[i].substr(prefix_len);
        sp[i] = ___specialchars_and_colour(sp[i].substr(0,prefix_len))
              + '<span id="'+id+'" class="plain-hash-or-ref" onmouseover="___hilite('+id+',\''+hash+'\')" onmouseout="___lolite('+id+',\''+hash+'\')">'
              + sp[i].substr(prefix_len)
              + '</span>';
      } else {
        sp[i] = ___specialchars_and_colour(sp[i]);
      }
    }
    for (; i < sp.length; i++) {
      sp[i] = ___specialchars_and_colour(sp[i]);
    }
    var sp_joined = sp.join('<span class="specialchar newline">\\n</span>');
    return [sz[0], sp_joined].join('<span class="specialchar newline">\\000</span>');
  } else {
    return ___specialchars_and_colour(s);
  }
}
function ___specialchars_and_colour_and_hex_and_zlib(s) {
  try {
    var inflated = pako.inflate(___stringToUint8Array(s));
  } catch(e) {
    var inflated = false;
  }
  if (inflated) {
    var id=___global_unique_id++;
    return {
      html:
        '<span id="deflated'+id+'-pretty">'
      + '<span class="deflated">deflated:</span>'
      + ___specialchars_and_colour_and_hex(___uint8ArrayToString(inflated))
      + '</span>'
      + '<span id="deflated'+id+'-raw" style="display:none">'
      + ___specialchars_and_colour_and_hex(s)
      + '</span>',
      td: function(td) { td.classList.add('deflate-toggle'); td.setAttribute('onclick', '___deflated_click('+id+')'); }
    };
  } else {
    return { html: ___specialchars_and_colour_and_hex(s), td: function() {} };
  }
}
function ___bytestring_to_printf(bs, trailing_x) {
  return 'printf ' + bs.replace(/[^a-zA-Z0-9_]/g, function(c) {
    return '\\\\x' + ___left_pad(c.charCodeAt(0).toString(16), 0, 2);
  }) + (trailing_x ? 'x' : '');
}
function ___filesystem_to_printf(fs) {
  var entries = ___sort_filesystem_entries(fs)
    .map(function (x) {
      if (x[1] === null) {
        return 'd="$('+___bytestring_to_printf(x[0], true)+')"; mkdir "${d%x}";';
      } else {
        return 'f="$('+___bytestring_to_printf(x[0], true)+')"; '+___bytestring_to_printf(x[1], false)+' > "${f%x}";';
      }
    })
    // directories start with 'd' which sorts before 'f'
    .sort((a,b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0));
  return entries.join(' ');
}
function ___deflated_click(id) {
  ___hilite_off();
  if (document.getElementById('deflated'+id+'-pretty').style.display != "none") {
    document.getElementById('deflated'+id+'-pretty').style.display = "none";
    document.getElementById('deflated'+id+'-raw').style.display = '';
  } else {
    document.getElementById('deflated'+id+'-pretty').style.display = '';
    document.getElementById('deflated'+id+'-raw').style.display = "none";
  }
}
function ___format_filepath(x) {
  var sp = x.split('/');
  if (sp.length > 3 && sp[sp.length-3] == 'objects' && /^[0-9a-f]{2}$/.test(sp[sp.length-2]) && /^[0-9a-f]{38}$/.test(sp[sp.length-1])) {
    return sp.slice(0, sp.length-2).map(___specialchars_and_colour).join('/')+(sp.length > 2 ? '/' : '')
         + '<span class="object-hash object-hash-'+sp.slice(sp.length-2).join('')+'">'
         + sp.slice(sp.length-2).map(___specialchars_and_colour).join('/')
         + "</span>";
  } else if (sp.length > 1 && sp.indexOf('refs') >= 0 && sp.length > sp.indexOf('refs') + 1) {
    var refs_idx = sp.indexOf('refs');
    return sp.slice(0, refs_idx).map(___specialchars_and_colour).join('/')+'/'
         + '<span class="object-hash object-hash-'+sp.slice(refs_idx).join('/')+'">'//TODO
         + sp.slice(refs_idx).map(___specialchars_and_colour).join('/')
         + "</span>";
  } else {
    return ___specialchars_and_colour(x);
  }
}
function ___format_entry(previous_filesystem, x) {
  var previous_filesystem = previous_filesystem || {};
  var tr = document.createElement('tr');
  if (! (previous_filesystem.hasOwnProperty(x[0]) && previous_filesystem[x[0]] == x[1])) {
    tr.classList.add('different');
  }

  var td_path = document.createElement('td');
  tr.appendChild(td_path);
  td_path.classList.add('cell-path');

  var td_path_code = document.createElement('code');
  td_path.appendChild(td_path_code);
  td_path_code.innerHTML = ___format_filepath(x[0]);

  var td_contents = document.createElement('td');
  tr.appendChild(td_contents);
  td_contents.classList.add('cell-contents');
  if (x[1] === null) {
    td_contents.innerHTML = '<span class="directory">Directory</span>';
  } else {
    var specials = ___specialchars_and_colour_and_hex_and_zlib(x[1]);
    td_contents.innerHTML = '<code>' + specials.html + '</code>';
    specials.td(td_contents);
  }

  return tr;
}
function ___sort_filesystem_entries(fs) {
  return Object.entries(fs)
    .sort((a,b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0));
}
function ___filesystem_to_table(fs, previous_filesystem) {
  var table = document.createElement('table');
  
  var thead = document.createElement('thead');
  table.appendChild(thead);

  var thead_tr = document.createElement('tr');
  thead.appendChild(thead_tr);
  
  var thead_tr_th_path = document.createElement('th');
  thead_tr.appendChild(thead_tr_th_path);
  thead_tr_th_path.innerText = 'Path';

  var thead_tr_th_contents = document.createElement('th');
  thead_tr.appendChild(thead_tr_th_contents);
  thead_tr_th_contents.classList.add('cell-contents');
  thead_tr_th_contents.innerText = 'Contents';
  
  var tbody = document.createElement('tbody');
  table.appendChild(tbody);
  var entries = ___sort_filesystem_entries(fs);
  for (var i = 0; i < entries.length; i++) {
    tbody.append(___format_entry(previous_filesystem, entries[i]));
  }
  if (entries.length == 0) {
    var tr_empty = document.createElement('tr');
    tbody.append(tr_empty);

    var td_empty = document.createElement('td');
    tr_empty.append(td_empty);
    td_empty.setAttribute('colspan', '2');
    td_empty.classList.add('empty-filesystem');
    td_empty.innerText = "The filesystem is empty."
  }
  return table;
}
function ___filesystem_to_string(fs, just_table, previous_filesystem) {
  var entries = ___sort_filesystem_entries(fs);
  var id = ___global_unique_id++;
  var html = '<div class="hilite-wrapper">';
  if (! just_table) {
    html += 'Filesystem contents: ' + entries.length + " files and directories. "
      + '<a href="javascript: ___copyprintf_click(\'elem-'+id+'\');">'
      + "Copy commands to recreate in *nix terminal"
      + "</a>."
      + "<br />"
      + '<textarea id="elem-'+id+'" disabled="disabled" style="display:none">'
      + ___specialchars(___filesystem_to_printf(fs) || 'echo "Empty filesystem."')
      + '</textarea>';
  }
  html += ___filesystem_to_table(fs, previous_filesystem).outerHTML // TODO: use DOM primitives instead.
    + '</div>';
  return html;
}
function ___textarea_value(elem) {
  if (elem.getValue) {
    return elem.getValue();
  } else {
    return elem.value;
  }
}
function ___copyprintf_click(id) {
  ___hilite_off();
  var elem = document.getElementById(id);
  if (elem.style.display != "none") {
    elem.style.display = "none";
  } else {
    elem.style.display = '';
    elem.focus();
    elem.disabled = false;
    elem.select();
    elem.setSelectionRange(0, elem.value.length * 10); // for mobile devices?
    document.execCommand('copy');
    elem.disabled = true;
  }
}
var ___script_log_header = ''
  + 'var ___log = [];\n'
  + 'var console = (function(real_console) {\n'
  + '  return {\n'
  + '    log: function() {\n'
  + '      ___log[___log.length] = Array.from(arguments);\n'
  + '      real_console.log.apply(console, arguments);\n'
  + '    },\n'
  + '    assert: real_console.assert,\n'
  + '  };\n'
  + '})(window.console);\n'
  + '\n';

function ___file_contents_to_graphviz(s) {
  try {
    var inflated = pako.inflate(___stringToUint8Array(s));
  } catch(e) {
    var inflated = false;
  }
  if (inflated) {
    var id=___global_unique_id++;
    return {
      html:
        '<span id="deflated'+id+'-pretty">'
      + '<span class="deflated">deflated:</span>'
      + ___specialchars_and_colour_and_hex(___uint8ArrayToString(inflated))
      + '</span>'
      + '<span id="deflated'+id+'-raw" style="display:none">'
      + ___specialchars_and_colour_and_hex(s)
      + '</span>',
      td: function(td) { td.classList.add('deflate-toggle'); td.setAttribute('onclick', '___deflated_click('+id+')'); }
    };
  } else {
    return { html: ___specialchars_and_colour_and_hex(s), td: function() {} };
  }
}  

function ___filesystem_to_graphviz(filesystem, previous_filesystem) {
  return "digraph graph_view {"
  + 'a -> b'
  + "}";
}

function ___eval_result_to_string(filesystem, previous_filesystem, log) {
  var loghtml = '<pre class="log">' + log.map(function(l) { return l.map(function (x) { return x.toString(); }).join(', '); }).join('\n') + '</pre>'
  return (log.length > 0 ? '<p>Console output:</p>' + loghtml : '')
    + Viz(___filesystem_to_graphviz(filesystem, previous_filesystem), "svg")
    + ___filesystem_to_string(filesystem, false, previous_filesystem);
}
function ___git_eval(current) {
  document.getElementById('hide-eval-' + current).style.display = '';
  var script = ___script_log_header;
  for (i = 0; i <= current - 1; i++) {
    script += ___textarea_value(___global_editors[i]);
  }
  script += '\n'
  + 'var ___previous_filesystem = {};\n'
  + 'for (k in filesystem) { ___previous_filesystem[k] = filesystem[k]; }\n'
  + '___log = [];\n';
  script += ___textarea_value(___global_editors[current]);
  script += '\n'
  + '"End of the script";\n'
  + '\n'
  + '\n'
  + 'document.getElementById("out" + current).innerHTML = ___eval_result_to_string(filesystem, ___previous_filesystem, ___log);\n'
  + 'filesystem;\n';
  try {
    eval(script);
  } catch (e) {
    // Stack traces usually include :line:column
    var rx = /:([0-9][0-9]*):[0-9][0-9]*/g;
    var linecol = rx.exec(''+e.stack);
    var line = null;
    if (linecol && linecol.length > 0) {
      line=parseInt(linecol[1]);
    } else {
      // Some older versions of Firefox and probably some other browsers use just :line
      var rx = /:([0-9][0-9]*)*/g;
      var justline = rx.exec(''+e.stack);
      if (justline && justline.length > 0) {
        line=parseInt(justline[1], 10);
      }
    }
    if (typeof(line) == 'number') {
      var lines = script.split('\n');
      if (line < lines.length) {
        var from = Math.max(0, line-2);
        var to = Math.min(lines.length - 1, line+2+1);
        var showline = ''
        + 'Possible location of the error: near line ' + line + '\n'
        + '\n'
        + lines.slice(from, to).map(function(l, i) { return '' + (from + i) + ': ' + l; }).join('\n')
        + '\n'
        + '\n';
      }
    } else {
      var showline = 'Sorry, this tutorial could not pinpoint precisely\nthe location of the error.\n'
                   + 'The stacktrace below may contain more information.\n'
    }
    var error = ___specialchars("" + e + "\n\n" + e.stack);
    document.getElementById('out' + current).innerHTML = '<pre class="error">' + showline + error + '</pre>';
  }
}

function ___level(s) {
  if (s) {
    return (s.tagName == 'SECTION' ? 1 : 0) + ___level(s.parentElement);
  } else {
    return 0;
  }
}
function ___process_elements() {
  var sections = document.getElementsByTagName('section');
  var stack = [[]];
  var previousLevel = 1;
  for (var i = 0; i < sections.length; i++) {
    var level = ___level(sections[i]);
    while (level < previousLevel) {
      var p = stack.pop();
      previousLevel--;
    }
    while (level > previousLevel) {
      var top_of_stack = stack[stack.length-1];
      stack.push(top_of_stack[top_of_stack.length-1].subsections);
      previousLevel++;
    }
    stack[stack.length-1].push({ s: sections[i], subsections: [] });
  }
  var nested = stack[0];
  document.getElementById('toc').appendChild(___sections_to_html(nested));
}
function ___sections_to_html(sections) {
  var ol = document.createElement('ol');
  for (var i = 0; i < sections.length; i++) {
    var li = document.createElement('li');
    ol.appendChild(li);
    var headers = sections[i].s.getElementsByTagName('h1');
    console.assert(!headers || headers.length >= 1)
    var target = sections[i].s.getAttribute('id');
    var a = document.createElement('a');
    li.appendChild(a);
    a.innerHTML = headers[0].innerHTML;
    if (target) { a.setAttribute('href', '#' + target); }
    if (target) {
      var a2 = document.createElement('a');
      ___insertAfter(a2, headers[0]);
      a2.className = "permalink"
      a2.setAttribute('href', '#' + target);
      a2.innerText = "🔗"
    }
    li.appendChild(___functions_to_html(sections[i].s));
    li.appendChild(___sections_to_html(sections[i].subsections));
  }
  return ol;
}
function ___insertAfter(elt, ref) {
  ref.parentElement.insertBefore(elt, ref.nextSibling);
}
function ___ancestor(elem, tag) {
  if (! elem) {
    return false;
  }
  if (elem.tagName.toLowerCase() == tag) {
    return elem;
  }
  return ___ancestor(elem.parentElement, tag);
}
var ___global_editors = [];
function ___functions_to_html(section) {
  var ul = document.createElement('ul');
  var ta = section.getElementsByTagName('textarea');
  for (var j = 0; j < ta.length; j++) {
    if (___ancestor(ta[j], 'section') == section) {
      var lines = ta[j].value.split('\n');
      var ret = ___toCodeMirror(ta[j]);
      var editor = ret.editor;
      var editor_id = ret.editor_id;
      editor.on('keydown', ___clearScrolledToLine);
      for (var i = 0; i < lines.length; i++) {
        var text = false;
        
        var fun = lines[i].match(/^function\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (fun) { text = fun[1]; }
        var v = lines[i].match(/^var\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
        if (v) { text = v[1]; }
        if (text) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.setAttribute('href', 'javascript: ___scrollToLine(___global_editors['+(editor_id)+'], '+i+'); void(0);');
          var code = document.createElement('code');
          if (fun) {
            var spanFunction = document.createElement('span');
            spanFunction.className = 'function';
            spanFunction.innerText = text;
            var parens = document.createTextNode('()');
            code.appendChild(spanFunction);
            code.appendChild(parens);
          } else {
            code.className = 'assignment';
            code.innerText = text;
          }
          a.appendChild(code);
          li.appendChild(a);
          ul.appendChild(li);
        }
      }
    }
  }
  return ul;
}
var ___global_current_highlighted_editor_and_line = false;
function ___clearScrolledToLine() {
  var current = ___global_current_highlighted_editor_and_line;
  if (current) {
    current.editor.removeLineClass(current.line, 'background', 'scrolled-to-line');
  }
  ___global_current_highlighted_editor_and_line = false;
}
function ___scrollToLine(editor, line) {
  ___clearScrolledToLine();
  ___global_current_highlighted_editor_and_line = { editor: editor, line: line };
  editor.addLineClass(line, 'background', 'scrolled-to-line');
  var editorOffset = ___getOffset(editor.getScrollerElement()).top;
  var lineOffset = editor.charCoords({line: line, ch: 0}, "local").top;
  document.body.scrollTo(0, editorOffset + lineOffset - window.innerHeight/2);
}
function ___toCodeMirror(ta) {
  var editor = CodeMirror.fromTextArea(ta, {
    mode: 'javascript',
    lineNumbers: true,
    viewportMargin: Infinity
  });
  var id = ta.getAttribute('id');
  ta.remove();
  var wrapper = editor.getWrapperElement();
  wrapper.setAttribute('id', id);
  var editor_id = ___global_editors.length;
  ___global_editors[editor_id] = editor;
  var eval_button = document.createElement('input');
  eval_button.setAttribute('type', 'button');
  eval_button.setAttribute('value', 'eval');
  eval_button.setAttribute('onclick', '___git_eval('+editor_id+')');
  ___insertAfter(eval_button, wrapper);
  var hide_eval_button = document.createElement('input');
  hide_eval_button.setAttribute('id', 'hide-eval-' + editor_id);
  hide_eval_button.setAttribute('type', 'button');
  hide_eval_button.setAttribute('value', 'hide output');
  hide_eval_button.setAttribute('onclick', '___hide_eval('+editor_id+')');
  hide_eval_button.style.display = 'none';
  ___insertAfter(hide_eval_button, eval_button);
  var out_div = document.createElement('div');
  out_div.setAttribute('id', 'out' + editor_id);
  ___insertAfter(out_div, hide_eval_button);
  return { editor: editor, editor_id: editor_id };
}
function ___hide_eval(editor_id) {
  document.getElementById('out' + editor_id).innerHTML = '';
  document.getElementById('hide-eval-' + editor_id).style.display = 'none';
  ___hilite_off();
}
function ___get_all_code() {
  var all = '';
  for (var i = 0; i < ___global_editors.length; i++) {
    var val = ___global_editors[i].getValue()
    all += val + (val.endsWith('\n') ? '' : '\n') + (val.endsWith('\n\n') ? '' : '\n');
  }
  return all.substr(0, all.length-1/*remove last newline in the last \n\n*/);
}
function ___copy_all_code() {
  var elem = document.getElementById('copy-all-code');
  if (elem.style.display != "none") {
    elem.style.display = "none";
  } else {
    elem.style.display = '';
    var elem2 = document.createElement('textarea');
    elem.innerHTML = '';
    elem.appendChild(elem2);
    var all_code = ___get_all_code();
    elem2.value = all_code
    elem2.focus();
    elem2.disabled = false;
    elem2.select();
    elem2.setSelectionRange(0, elem2.value.length * 10); // for mobile devices?
    document.execCommand('copy');
    elem2.disabled = true;
  }
}

function ___loc_count() {
  var srclines = ___get_all_code().split('\n');
  var lcv = srclines.filter(function (l) { return ! (/^(\s*}?)?$/.test(l)); }).length
  var lc = document.getElementsByClassName('loc-count');
  for (var i = 0; i < lc.length; i++) {
    lc[i].innerText = lcv;
  }
  var lctv = srclines.length;
  var lct = document.getElementsByClassName('loc-count-total');
  for (var i = 0; i < lct.length; i++) {
    lct[i].innerText = lctv;
  }
}

function ___git_tutorial_onload() {
  ___process_elements();
  ___loc_count();
}