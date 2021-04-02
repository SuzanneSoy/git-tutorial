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
var global_current_hilite = { src: false, dests: [] };
function ___hilite_off() {
  if (global_current_hilite.src) {
    global_current_hilite.src.classList.remove('hilite-src');
  }
  for (var d = 0; d < global_current_hilite.dests.length; d++) {
    global_current_hilite.dests[d].classList.remove('hilite-dest');
  }
  global_current_hilite = { src: false, dests: [] };
  document.getElementById('lines').innerHTML = '';
}
function ___hilite(src, dest) {
  ___hilite_off();
  var src = document.getElementById(src);
  var wrapper = src;
  while (wrapper && !wrapper.classList.contains('hilite-wrapper')) { wrapper = wrapper.parentElement; }
  var dests = (wrapper || document).getElementsByClassName(dest);

  global_current_hilite = { src, dests };

  src.classList.add('hilite-src');
  var lines = document.getElementById('lines');
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

    var op = ___getOffset(l1.offsetParent);

    var xa = Math.floor(osrc.left - op.left + src.offsetWidth);
    var ya = Math.floor(osrc.top  - op.top  + src.offsetHeight / 2);
    var xb = Math.floor(otr.left - op.left + tr.offsetWidth);
    var yb = Math.floor(otr.top  - op.top  + tr.offsetHeight / 2);
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

    var thickness = 2;

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
    l3.style.width = p3.left-p4.left;
    l3.style.height = thickness+'px';
    l3.style.backgroundColor = 'red';
    l3.style.top  = p4.top;
    l3.style.left = p4.left;
  }
}
function ___lolite(src, dest) {
}
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
    return '<span onClick="___deflated_click('+id+')">'
      + '<span id="deflated'+id+'-pretty">'
      + '<span class="deflated">deflated:</span>'
      + ___specialchars_and_colour_and_hex(___uint8ArrayToString(inflated))
      + '</span>'
      + '<span id="deflated'+id+'-raw" style="display:none">'
      + ___specialchars_and_colour_and_hex(s)
      + '</span>'
      + '</span>';
  } else {
    return ___specialchars_and_colour_and_hex(s);
  }
}
function ___bytestring_to_printf(bs, trailing_x) {
  return 'printf ' + bs.replace(/[^a-zA-Z0-9_]/g, function(c) {
    return '\\\\x' + ___left_pad(c.charCodeAt(0).toString(16), 0, 2);
  }) + (trailing_x ? 'x' : '');
}
function ___filesystem_to_printf(fs) {
  var entries = Object.entries(fs)
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
function ___format_entry(x) {
  return '<tr><td class="cell-path"><code>'
    + ___format_filepath(x[0])
    + '</code></td><td class="cell-contents">'
    + (x[1] === null
        ? '<span class="directory">Directory</span>'
        : ("<code>" + ___specialchars_and_colour_and_hex_and_zlib(x[1]) + "</code>"))
    + "</td></tr>";
}
function ___filesystem_to_string(fs) {
  var entries = Object.entries(fs)
    .sort((a,b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0))
    .map(___format_entry);
  var id = ___global_unique_id++;
  return '<div class="hilite-wrapper">Filesystem contents: ' + entries.length + " files and directories. "
    + '<a href="javascript: ___copyprintf_click(\'elem-'+id+'\');">'
    + "Copy commands to recreate in *nix terminal"
    + "</a>."
    + "<br />"
    + '<textarea id="elem-'+id+'" disabled="disabled" style="display:none">'
    + ___specialchars(___filesystem_to_printf(fs) || 'echo "Empty filesystem."')
    + '</textarea>'
    + "<table>" + entries.join('') + "</table></div>";
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
var global_filesystem=false;
function ___git_eval(current) {
  document.getElementById('hide-eval-' + current).style.display = '';
  var script = '';
  for (i = 0; i <= current; i++) {
    script += ___textarea_value(___global_editors[i]);
  }
  script += "\n document.getElementById('out' + current).innerHTML = ___filesystem_to_string(filesystem); filesystem;";
  try {
    global_filesystem = eval(script);
  } catch (e) {
    var error = ___specialchars("" + e + "\n\n" + e.stack);
    document.getElementById('out' + current).innerHTML = '<pre class="error">' + error + '</pre>';
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
          if (fun) { text = fun[1] + '()'; }
          var v = lines[i].match(/^var\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
          if (v) { text = v[1]; }

          if (text) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.setAttribute('href', 'javascript: ___scrollToLine(___global_editors['+(editor_id)+'], '+i+'); void(0);');
            var code = document.createElement('code');
            code.innerText = text;
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
      all += ___global_editors[i].getValue();
    }
    return all;
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
  ___process_elements();
  document.getElementById('loc-count').innerText = ___get_all_code().split('\n').filter(function (l) { return ! (/^(\s*}?)?$/.test(l)); }).length;
  document.getElementById('loc-count-total').innerText = ___get_all_code().split('\n').length;