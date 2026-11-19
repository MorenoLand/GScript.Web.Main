function loadTimestamps(setTimestamps, setLoading, changesCache) {
  const cached = Object.keys(changesCache.current).length > 0;
  if (!cached) setLoading(true);
  fetch('https://api.moreno.land/api/graalstats/changes/timestamps').then(r => r.json()).then(data => { setTimestamps(data.timestamps); loadChangesData(data.timestamps.slice(0, 5), cached, setChangesData, setLoading, changesCache); }).catch(err => { console.error('Error loading timestamps:', err); setLoading(false); });
}

function loadChangesData(pageTimestamps, skipLoading, setChangesData, setLoading, changesCache) {
  const cacheKey = JSON.stringify(pageTimestamps);
  if (changesCache.current[cacheKey]) { setChangesData({entries: changesCache.current[cacheKey]}); if (skipLoading) setLoading(false); return; }
  if (!skipLoading) setLoading(true);
  fetch('https://api.moreno.land/api/graalstats/changes/data', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({timestamps: pageTimestamps})}).then(r => r.json()).then(result => {
    const entries = result.results || [], data = [];
    entries.forEach(entry => {
      const timestamp = entry.timestamp, date = new Date(timestamp * 1000), dateStr = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear().toString().slice(-2) + ' ' + date.toLocaleTimeString();
      const addedArray = [], removedArray = [], renamedArray = [];
      if (entry.changes) {
        entry.changes.forEach(change => {
          const serverId = change.server_id, changeType = change.change_type;
          if (changeType === 'Added') { const name = change.server_name || serverId, iconPath = 'gfx/login_icon_' + serverId + '.png', imgTag = '<img src="' + iconPath + '" style="width: 40px; height: 40px; vertical-align: middle; margin-right: 5px;" onerror="this.src=\'gfx/login_icon_developer4.png\'">'; addedArray.push('<a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + imgTag + '</a><a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + name + '</a>'); }
          else if (changeType === 'Removed') { const name = change.old_name, imgTag = '<img src="gfx/login_icon_graal classic.png" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 5px;">'; removedArray.push('<a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + imgTag + '</a><a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + name + '</a>'); }
          else if (changeType === 'Renamed') { const oldName = change.old_name, newName = change.new_name, imgTag = '<img src="gfx/login_icon_login3.png" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 5px;">'; renamedArray.push('<a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + imgTag + '</a><a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + oldName + '</a> to <a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + imgTag + '</a><a href="#' + serverId + '" style="color: #40ff40; text-decoration: none;">' + newName + '</a>'); }
        });
      }
      const listings = [];
      if (addedArray.length > 0) listings.push('Added ' + addedArray.join(', '));
      if (removedArray.length > 0) listings.push('Removed ' + removedArray.join(', '));
      if (renamedArray.length > 0) listings.push('Renamed ' + renamedArray.join(', '));
      if (listings.length > 0) data.push({header: 'Changes on ' + dateStr, content: '<div class="server-listing">' + listings.join('<br>') + '</div>'});
    });
    changesCache.current[cacheKey] = data;
    setChangesData({entries: data});
    setLoading(false);
  });
}

function ChangesView(props) {
  const {
    allServers,
    changesData, setChangesData,
    timestamps, setTimestamps,
    filteredServer, setFilteredServer,
    changesPage, setChangesPage,
    changesPerPage, setChangesPerPage,
    changesCache, loading, setLoading
  } = props;

  React.useEffect(() => { if (timestamps.length === 0) loadTimestamps(setTimestamps, setLoading, changesCache); }, []);

  React.useEffect(() => { if (timestamps.length > 0) { const currentPageStart = (changesPage - 1) * changesPerPage, currentPageTimestamps = timestamps.slice(currentPageStart, currentPageStart + changesPerPage); loadChangesData(currentPageTimestamps, true, setChangesData, setLoading, changesCache); }}, [changesPerPage, timestamps]);

  const filteredEntries = filteredServer ? changesData.entries.filter(entry => entry.content && entry.content.toLowerCase().includes(filteredServer.toLowerCase())) : changesData.entries;

  const handleChangesPageChange = (page) => {
    setChangesPage(page);
    const offset = (page - 1) * changesPerPage, pageTimestamps = timestamps.slice(offset, offset + changesPerPage);
    loadChangesData(pageTimestamps, false, setChangesData, setLoading, changesCache);
  };

  const setViewAndTrack = (newView) => {
    const url = new URL(window.location);
    if (newView === 'graph') { url.searchParams.set('graph', ''); url.searchParams.delete('changes'); }
    else if (newView === 'list') { url.searchParams.delete('graph'); url.searchParams.delete('changes'); }
    window.history.pushState(null, '', url);
  };

  return React.createElement(React.Fragment, null,
    React.createElement('div', {style: {display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px'}},
      React.createElement('p', null, 'There are currently ', React.createElement('font', {color: '#ffe066', style: {textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}, allServers.reduce((sum, s) => sum + (s.player_count || 0), 0).toLocaleString(), ' player(s)'), ' online across ', React.createElement('font', {color: '#ffe066', style: {textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}, allServers.length, ' server(s)'), '.'),
      React.createElement('p', {style: {marginTop: '1px'}}, React.createElement('a', {href: '/?graph', onClick: (e) => { e.preventDefault(); window.location.href = '/?graph'; }, style: {color: '#40ff40', textDecoration: 'none', cursor: 'pointer', textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}, 'View Graph'), React.createElement('br'), React.createElement('a', {href: '/?list', onClick: (e) => { e.preventDefault(); window.location.href = '/?list'; }, style: {color: '#40ff40', textDecoration: 'none', cursor: 'pointer', textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}, 'View List'))
    ),
    React.createElement('div', {className: 'table-wrapper', style: {display: 'flex', flexDirection: 'column', gap: '0', width: '100%', maxWidth: '900px', margin: '0 auto'}},
      React.createElement('div', {className: 'stats-window changes-window', style: {backgroundColor: 'rgba(3, 14, 8, 0.55)', borderRadius: '8px 8px 0 0', overflow: 'hidden'}},
        React.createElement('table', {style: {borderCollapse: 'collapse', tableLayout: 'auto', margin: '0', width: '100%', borderRadius: '0'}},
          React.createElement('tbody', null, filteredEntries && filteredEntries.length > 0 ? filteredEntries.map((entry, index) => React.createElement('tr', {key: index}, React.createElement('td', {style: {padding: '12px 10px', borderBottom: index < filteredEntries.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none', borderRadius: '0 !important'}}, React.createElement('div', {dangerouslySetInnerHTML: {__html: entry.header}, style: {fontSize: '20px', color: 'white', marginBottom: '8px', textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}), React.createElement('div', {dangerouslySetInnerHTML: {__html: entry.content}, style: {wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal'}, onClick: (e) => { const target = e.target; if (target.tagName === 'A' && target.getAttribute('href').startsWith('#')) { e.preventDefault(); const serverName = target.getAttribute('href').substring(1); setFilteredServer(filteredServer === serverName ? null : serverName); setChangesPage(1); }}})))) : React.createElement('tr', null, React.createElement('td', {style: {textAlign: 'center', padding: '20px'}}, filteredServer ? 'No changes found for this server.' : 'No changes found.'))
          )
        )
      ),
      React.createElement('div', {className: 'changes-foot', style: {display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '4px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: 'rgba(3, 14, 8, 0.55)', borderRadius: '0 0 8px 8px', gap: '20px', fontSize: '0.875rem', color: '#ffffff'}},
        filteredServer ? React.createElement('div', {style: {display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto'}}, React.createElement('span', null, 'Filtering by: ', React.createElement('strong', {style: {color: '#8fc46b'}}, filteredServer)), React.createElement('button', {onClick: () => { setFilteredServer(null); setChangesPage(1); }, style: {padding: '4px 12px', backgroundColor: 'rgba(255, 100, 100, 0.3)', border: '1px solid rgba(255, 100, 100, 0.5)', color: '#ffffff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem'}}, 'Clear Filter')) : null,
        React.createElement('div', {style: {display: 'flex', alignItems: 'center', gap: '8px'}}, React.createElement('span', null, 'Rows per page:'), React.createElement('select', {value: changesPerPage, onChange: (e) => { setChangesPerPage(parseInt(e.target.value)); setChangesPage(1); }, style: {padding: '4px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.23)', color: '#ffffff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem'}}, React.createElement('option', {value: 5}, '5'), React.createElement('option', {value: 10}, '10'), React.createElement('option', {value: 25}, '25'), React.createElement('option', {value: 50}, '50'))),
        React.createElement(React.Fragment, null, React.createElement('span', null, (changesPage - 1) * changesPerPage + 1, '-', Math.min(changesPage * changesPerPage, timestamps.length), ' of ', timestamps.length), React.createElement('div', {style: {display: 'flex', gap: '4px', alignItems: 'center'}}, React.createElement('button', {onClick: () => handleChangesPageChange(Math.max(1, changesPage - 1)), disabled: changesPage === 1, style: {padding: '1px 8px 5px 8px', backgroundColor: 'transparent', border: 'none', color: changesPage === 1 ? 'rgba(255, 255, 255, 0.26)' : 'rgba(255, 255, 255, 0.74)', cursor: changesPage === 1 ? 'default' : 'pointer', borderRadius: '4px', fontSize: '1.25rem', lineHeight: '1'}}, '<'), (() => { const totalPages = Math.ceil(timestamps.length / changesPerPage), pages = []; if (totalPages <= 9) { for (let i = 1; i <= totalPages; i++) pages.push(i); } else { pages.push(1); const start = Math.max(2, changesPage - 2), end = Math.min(totalPages - 1, changesPage + 2); if (start > 2) pages.push('…'); for (let i = start; i <= end; i++) pages.push(i); if (end < totalPages - 1) pages.push('…'); pages.push(totalPages); } return pages.map((page, index) => page === '…' ? React.createElement('span', {key: 'gap' + index, style: {padding: '0 2px', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem'}}, '…') : React.createElement('button', {key: page, onClick: () => handleChangesPageChange(page), style: {padding: '4px 8px', backgroundColor: changesPage === page ? 'rgba(46, 110, 60, 1)' : 'transparent', border: 'none', color: changesPage === page ? '#ffffff' : 'rgba(255, 255, 255, 0.74)', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem'}}, page.toString())); })(), React.createElement('button', {onClick: () => handleChangesPageChange(Math.min(Math.ceil(timestamps.length / changesPerPage), changesPage + 1)), disabled: changesPage === Math.ceil(timestamps.length / changesPerPage), style: {padding: '1px 8px 5px 8px', backgroundColor: 'transparent', border: 'none', color: changesPage === Math.ceil(timestamps.length / changesPerPage) ? 'rgba(255, 255, 255, 0.26)' : 'rgba(255, 255, 255, 0.74)', cursor: changesPage === Math.ceil(timestamps.length / changesPerPage) ? 'default' : 'pointer', borderRadius: '4px', fontSize: '1.25rem', lineHeight: '1'}}, '>')))
      )
    ),
    React.createElement('footer', {style: {textAlign: 'center', marginTop: '20px', color: '#ffffff'}}, React.createElement('p', null, 'This data is updated every 10 minutes.'), React.createElement('p', null, React.createElement('a', {href: 'https://graalonline.com', style: {color: '#40ff40', textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}, 'Graal Online'), ' is Copyright/trademarked to ', React.createElement('a', {href: 'https://www.toonslab.com/', style: {color: '#40ff40', textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 3px 3px 4px rgba(0,0,0,.95)'}}, 'Toonslab'), ' and is in no way affiliated with this site.'))
  );
}
