const DATA_URL = "links.json"

let data = null
let jsonSha = null
let expanded = true
let show_more = false

document.addEventListener("DOMContentLoaded", () => {
    init()
})

async function init() {
    await loadLinks()
    renderCatalogue()
    renderAdmin()
    setupForm()
    setupSaveButton()
    setupExpandAll()
}

function generateId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/* --------------------------
LOAD JSON
-------------------------- */
async function loadLinks(){
    try{
        const res = await fetch(DATA_URL)
        data = await res.json()
        data.themes.forEach(theme=>{
            theme.links.forEach(link=>{
                if(!link.id){
                    link.id = generateId(64)
                }
            })
        })
        //console.log("links loaded", data)
    } catch(e) {
        console.error("Failed loading links.json", e)
    }
}

/* --------------------------
FAVICON
-------------------------- */
function favicon(url){
    try{
        const domain = new URL(url).hostname
        return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
    }catch{
        return ""
    }
}

function toggleSection(list, force = null) {
    const isOpen = list.classList.contains("open")
    const shouldOpen = force !== null ? force : !isOpen

    if (shouldOpen) {
        list.classList.add("open")

        const height = list.scrollHeight
        list.style.height = height + "px"

        setTimeout(() => {
            list.style.height = "auto"
        }, 280)
    } else {
        const height = list.scrollHeight
        list.style.height = height + "px"

        requestAnimationFrame(() => {
            list.style.height = "0px"
        })

        setTimeout(() => {
            list.classList.remove("open")
        }, 280)
    }
}

/* --------------------------
CATALOGUE PAGE
-------------------------- */
function renderCatalogue(){
    const container = document.getElementById("themes")
    if(!container || !data) return 
    
    container.innerHTML = ""
    container.className="row"
    
    data.themes.forEach(theme=>{
        const col = document.createElement("div")
        col.className = "col-lg-4 col-md-6 col-12 mb-4"
        
        const card = document.createElement("div")
        card.className = "card shadow-sm"
        
        const body = document.createElement("div")
        body.className = "card-body"
        
        const title = document.createElement("h5")
        title.className = "card-title theme-title"
        title.textContent = theme.name
        
        const list = document.createElement("div")
        //list.className = "theme-links"
        list.className = "theme-links open"
        list.style.height = "0px"
        
        theme.links.forEach((link,i)=>{
            const el = document.createElement("div")

            el.className="link"

            if(i>=8) el.style.display="none"

            el.dataset.name = link.name || ""
            el.dataset.desc = link.description || ""
            el.dataset.url = link.url || ""

            el.innerHTML = `
            <img class="favicon" src="${favicon(link.url)}">
            <a href="${link.url}" target="_blank" title="${link.description}">
            ${link.name}
            </a>
            `

            list.appendChild(el)
        })

        if(theme.links.length > 8){
            const btn = document.createElement("button")
            btn.className="btn btn-sm btn-outline-secondary mt-2"
            btn.textContent="Show more..."

            btn.onclick = ()=>{
                show_more = !show_more

                list.querySelectorAll(".link").forEach((l,i)=>{
                    if(i>=8){
                        l.style.display = show_more ? "flex" : "none"
                    }
                })
                btn.textContent = show_more ? "Show less" : "Show more..."
            }
            list.appendChild(btn)
        }
        
        title.onclick = ()=>{
            toggleSection(list)
        }

        body.appendChild(title)
        body.appendChild(list)
        card.appendChild(body)
        col.appendChild(card)

        container.appendChild(col)
    })
    initSearch()
}

/* --------------------------
SEARCH
-------------------------- */
function initSearch(){
    const input = document.getElementById("search")
    if(!input) return

    input.oninput = () => {
        const q = input.value.toLowerCase()
        document.querySelectorAll(".link").forEach(link=>{
            const name = link.dataset.name || ""
            const desc = link.dataset.desc || ""
            const url = link.dataset.url || ""

            const combined = (name + " " + desc + " " + url).toLowerCase()
            const anchor = link.querySelector("a")

            if(combined.includes(q)){
                link.style.display="flex"
                anchor.innerHTML = highlightText(name,q)
            }else{
                link.style.display="none"
            }

        })
    }
}

/* --------------------------
ADMIN PAGE
-------------------------- */
function renderAdmin() {
    const container = document.getElementById("adminThemes")
    //console.log("renderAdmin", container, data)
    if (!container || !data) return

    container.innerHTML = ""
    container.className = "row"

    data.themes.forEach((theme, tIndex) => {
        const col = document.createElement("div")
        col.className = "col-lg-4 col-md-6 mb-4"

        const card = document.createElement("div")
        card.className = "card"

        const body = document.createElement("div")
        body.className = "card-body"

        const title = document.createElement("h5")
        title.innerHTML = `
        <span class="theme-handle" style="cursor:grab">☰</span>
        <span class="theme-title">${theme.name}</span>
        `

        title.querySelector(".theme-title").ondblclick = ()=>{
            const newName = prompt("Theme name", theme.name)

            if(!newName) return

            theme.name = newName

            renderAdmin()
            renderCatalogue()
        }

        card.dataset.theme = theme.name
        title.style.cursor = "pointer"

        const list = document.createElement("div")
        //list.className = "list-group theme-links"
        list.className = "list-group theme-links open"

        theme.links.forEach((link, lIndex) => {
            const item = document.createElement("div")
            item.className = "list-group-item d-flex justify-content-between align-items-center"

            item.innerHTML = `
            <span class="drag-handle me-2" style="cursor:grab">☰</span>

            <div class="flex-grow-1">
            <strong data-id="${link.id}">${link.name}</strong><br>
            <small>${link.url}</small>
            </div>

            <button class="btn btn-sm btn-danger">×</button>
            `

            item.querySelector("button").onclick = (e) => {
                e.stopPropagation()
                deleteLink(tIndex, lIndex)
            }

            item.querySelector(".flex-grow-1").onclick = () => editLink(tIndex, lIndex)

            list.appendChild(item)
        })

        body.appendChild(title)
        body.appendChild(list)

        title.onclick = (e)=>{
            if(e.target.classList.contains("theme-handle")) return
        }

        card.appendChild(body)
        col.appendChild(card)

        container.appendChild(col)

        if (typeof Sortable !== "undefined") {
            new Sortable(list,{
              group:"links",
              animation:150,
              handle:".drag-handle",
              onEnd:updateAllOrders
            })
        }
    })
    populateThemeDropdown()
    initThemeDrag()
}

/* --------------------------
DROPDOWN THEME
-------------------------- */
function populateThemeDropdown(){
    const select = document.getElementById("theme")
    if(!select) return

    select.innerHTML=""
    data.themes
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name, undefined, {sensitivity:'base'}))
    .forEach(t=>{
        const opt=document.createElement("option")
        opt.value=t.name
        opt.textContent=t.name

        select.appendChild(opt)
    })
    const add=document.createElement("option")
    add.value="__new__"
    add.textContent="+ Add new theme"

    select.appendChild(add)

    select.onchange=()=>{
    const newField=document.getElementById("newTheme")
        if(select.value==="__new__"){
            newField.classList.remove("d-none")
        }else{
            newField.classList.add("d-none")
        }
    }
}

/* --------------------------
REORDER FIX
-------------------------- */
function updateAllOrders(){
    const themeCards = document.querySelectorAll("#adminThemes .card")

    themeCards.forEach((card,tIndex)=>{
        const items = card.querySelectorAll(".list-group-item")
        const newLinks = []

        items.forEach(item=>{
            const id = item.querySelector("strong").dataset.id
            const link = data.themes.flatMap(t=>t.links).find(l=>l.id === id)
            if(link) newLinks.push(link)
        })
        data.themes[tIndex].links = newLinks
    })
}

/* --------------------------
INLINE EDIT
-------------------------- */
function editLink(t, l) {
    const link = data.themes[t].links[l]

    const name = prompt("Name", link.name)
    if (name === null) return

    const url = prompt("URL", link.url)
    if (url === null) return

    const description = prompt("Description", link.description || "")

    link.name = name
    link.url = url
    link.description = description

    renderAdmin()
}

/* --------------------------
THEME DRAG
-------------------------- */
function initThemeDrag(){
  const container = document.getElementById("adminThemes")
  if(!container) return

  new Sortable(container,{
    animation:150,
    handle:".theme-handle",
    onEnd(){
      const cards = container.querySelectorAll(".card")
      const newThemes = []

      cards.forEach(card=>{
        const name = card.dataset.theme
        const theme = data.themes.find(t=>t.name===name)
        if(theme) newThemes.push(theme)
      })
      data.themes = newThemes
    }
  })
}

/* --------------------------
DELETE
-------------------------- */
function deleteLink(t,l){
    data.themes[t].links.splice(l,1)

    if(data.themes[t].links.length === 0){
        data.themes.splice(t,1)
    }
    renderAdmin()
    renderCatalogue()
}

/* --------------------------
FORM
-------------------------- */
function setupForm() {
    const form = document.getElementById("addForm")
    if (!form) return

    form.onsubmit = e => {
        e.preventDefault()

        let themeName = document.getElementById("theme").value
        const newThemeField = document.getElementById("newTheme")

        if(themeName==="__new__"){
          themeName = newThemeField.value.trim()
        }
        const name = document.getElementById("name1").value.trim()
        const description = document.getElementById("description").value.trim()
        let url = document.getElementById("url").value.trim()

        if(!url.startsWith("http")) {
            url = "https://" + url
        }

        if (!themeName || !url) {
            alert("Theme and URL required")
            return
        }

        let theme = data.themes.find(t => t.name === themeName)

        if (!theme) {
            theme = { name: themeName, links: [] }
            data.themes.push(theme)
        }

        theme.links.push({
            id: generateId(64),
            name: name || url,
            description,
            url
        })

        renderAdmin()
        renderCatalogue()

        form.reset()
    }
}

async function fetchMetadata(url){
    try{
        const res = await fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(url))
        const text = await res.text()
        const doc = new DOMParser().parseFromString(text,"text/html")
        const title = doc.querySelector("title")?.innerText || url
        return {title}
    }catch{
        return {title:url}
    }
}

/* --------------------------
SAVE TO GITHUB
-------------------------- */
function setupSaveButton() {
    const saveBtn = document.getElementById("saveBtn")
    if (!saveBtn) return

    saveBtn.onclick = saveToGitHub
}

async function saveToGitHub(){
    const repo = "CatShadow/Lniks"
    const token = prompt("GitHub token")
    if (!token) return
    const api = `https://api.github.com/repos/${repo}/contents/links.json`
    const get = await fetch(api )
    const file = await get.json()
    const sha = file.sha
    await fetch(api ,{
        method:"PUT",
        headers:{
            Authorization:"token " + token,
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            message:"update links",
            content:btoa(JSON.stringify(data,null,2)),
            sha:sha
        })
    })
    alert("Saved to GitHub")
}

/* --------------------------
EXPAND ALL
-------------------------- */
let btnIndex = null
let btnAdmin = null

function setupExpandAll(){
    btnIndex = document.getElementById("toggleAll")
    btnAdmin = document.getElementById("toggleAllAdmin")

    if(btnIndex){
        btnIndex.onclick = toggleAll
    }

    if(btnAdmin){
        btnAdmin.onclick = toggleAll
    }
}

function toggleAll(){
    expanded = !expanded

    document.querySelectorAll(".theme-links").forEach(list=>{
        toggleSection(list, expanded)
    })

    const text = expanded ? "Collapse All" : "Expand All"

    if(btnIndex) btnIndex.textContent = text
    if(btnAdmin) btnAdmin.textContent = text
}

/* --------------------------
HIGHLIGHT
-------------------------- */
function highlightText(text,query){
    if(!query) return text

    const regex = new RegExp(`(${query})`,"gi")

    return text.replace(regex,'<span class="highlight">$1</span>')
}
