import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Build clean card template (replaces lines 1605-1641, 0-indexed 1604-1640)
new_block_lines = [
    '\n',
    '            cont.innerHTML = `<div class="grid-premium">${paginatedItems.map((g, idx) => {\n',
    '                const mainImg = g.mainImg;\n',
    '                const priceLabel = g.minPrice === g.maxPrice\n',
    "                    ? `$${g.minPrice.toFixed(0)}`\n",
    "                    : `Desde $${g.minPrice.toFixed(0)}`;\n",
    '                const colorCount = g.allColors.length;\n',
    "                const colorLabel = colorCount > 1 ? `${colorCount} colores` : '';\n",
    '                const gIdx = groupedCatalog.indexOf(g);\n',
    '                return `\n',
    '                <div class="card-premium" style="animation-delay: ${idx * 0.1}s" onclick="openGroupModal(${gIdx})">\n',
    '                    <div class="img-box">\n',
    '                        ${mainImg\n',
    '                        ? `<img src="${typeof mainImg === \'string\' ? mainImg : mainImg.primary}" \n',
    '                                alt="${g.name}" \n',
    '                                referrerpolicy="no-referrer"\n',
    '                                onload="this.parentElement.classList.add(\'loaded\')"\n',
    """                                onerror="handleImgError(this, ${JSON.stringify(mainImg).replace(/"/g, '&quot;')})">\n""",
    '                               <div class="img-fallback" style="display:none"><span class="material-symbols-outlined">identity_platform</span><p>PRIVATE MEDIA</p></div>`\n',
    '                        : `<div class="img-fallback"><span class="material-symbols-outlined">identity_platform</span><p>NO MEDIA</p></div>`\n',
    '                    }\n',
    '                        <div class="price-tag">${priceLabel}</div>\n',
    '                        <button class="add-quick" onclick="event.stopPropagation(); openGroupModal(${gIdx})">\n',
    '                            <span class="material-symbols-outlined">add</span>\n',
    '                        </button>\n',
    '                    </div>\n',
    '                    <div class="info-premium">\n',
    '                        <span class="product-label">${g.marca}</span>\n',
    '                        <h3 class="product-title">${g.name}</h3>\n',
    '                        <div class="product-status">\n',
    """                            ${colorLabel ? `<span style="font-size:9px; color:var(--liquid-gold); text-transform:uppercase; letter-spacing:0.1em; font-weight:700;">${colorLabel}</span>` : ''}\n""",
    "                            <div class=\"dot ${g.totalStock < 5 ? 'dot-red' : 'dot-green'}\"></div>\n",
    "                            <span class=\"status-text\">${g.totalStock < 5 ? '\u00daltimas piezas' : 'Disponible'}</span>\n",
    '                        </div>\n',
    '                    </div>\n',
    '                </div>\n',
    '            `;\n',
    "            }).join('')}</div>`;\n",
    '        }\n',
]

# Also fix openGroupModal to accept numeric index instead of key string
# Find the openGroupModal function and replace it
old_opengroup = """        function openGroupModal(key) {
            const group = groupedCatalog.find(g => g.key === key);
            if (!group || group.variants.length === 0) {
                console.error("DLUX: Grupo no encontrado", key);
                closeAll();
                return;
            }"""

new_opengroup = """        function openGroupModal(idx) {
            const group = groupedCatalog[idx];
            if (!group || group.variants.length === 0) {
                console.error("DLUX: Grupo no encontrado", idx);
                closeAll();
                return;
            }"""

# Replace lines 1604-1641 (0-indexed) with new block
new_lines = lines[:1604] + new_block_lines + lines[1642:]

# Now join and do the openGroupModal fix
content = ''.join(new_lines)
content = content.replace(old_opengroup, new_opengroup)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS: Fixed card template and openGroupModal')
