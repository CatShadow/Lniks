const DATA_URL = "links.json"

let data = null
let jsonSha = null

document.addEventListener("DOMContentLoaded", () => {
    init()
})

async function init() {
    await loadLinks()
    renderCatalogue()
    renderAdmin()
    setupForm()
    setupSaveButton()
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
        
        theme.links.forEach(link=>{
            const el = document.createElement("div")
            el.className="link"
            
            el.innerHTML=`
            <img class="favicon" src="${favicon(link.url)}">
            <a href="${link.url}" target="_blank" title="${link.description}">
            ${link.name}
            </a>
            `
            
            list.appendChild(el)
        })
        
        title.onclick=()=>{
            list.classList.toggle("d-none")
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

    input.oninput=()=>{
        const q = input.value.toLowerCase()
        document.querySelectorAll(".link").forEach(link=>{
            const text = link.innerText.toLowerCase()
            link.style.display = text.includes(q) ? "flex" : "none"
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

        card.dataset.theme = theme.name
        title.style.cursor = "pointer"

        title.onclick = () => {
            const newName = prompt("Theme name", theme.name)

            if(!newName) return

            theme.name = newName

            renderAdmin()
            renderCatalogue()
        }

        const list = document.createElement("div")
        list.className = "list-group"

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

            item.onclick = () => editLink(tIndex, lIndex)

            list.appendChild(item)
        })

        body.appendChild(title)
        body.appendChild(list)

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

  data.themes.forEach(t=>{

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
        const url = document.getElementById("url").value.trim()

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
        const res=await fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(url))
        const text=await res.text()
        const doc=new DOMParser().parseFromString(text,"text/html")
        const title=doc.querySelector("title")?.innerText || url
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
    const repo="CatShadow/Lniks"
    const token=prompt("GitHub token")
    if (!token) return
    const api =`https://api.github.com/repos/${repo}/contents/links.json`
    const get=await fetch(api )
    const file=await get.json()
    const sha=file.sha
    await fetch(api ,{
        method:"PUT",
        headers:{
            Authorization:"token "+token,
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
