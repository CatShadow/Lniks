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

/* --------------------------
LOAD JSON
-------------------------- */
async function loadLinks(){
    try{
        const res = await fetch(DATA_URL)
        data = await res.json()
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
        title.textContent = theme.name

        const list = document.createElement("div")
        list.className = "list-group"

        theme.links.forEach((link, lIndex) => {

            const item = document.createElement("div")
            item.className = "list-group-item d-flex justify-content-between align-items-center"

            item.innerHTML = `
            <div>
              <strong>${link.name}</strong><br>
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
            new Sortable(list, {
                group: "links",
                animation: 150,
                onEnd: updateAllOrders
            })
        }
    })
}

/* --------------------------
REORDER FIX
-------------------------- */
function updateAllOrders() {
    const themeBlocks = document.querySelectorAll("#adminThemes .card")

    themeBlocks.forEach((card, tIndex) => {
        const items = card.querySelectorAll(".list-group-item")
        const newLinks = []

    items.forEach(item => {
        const name = item.querySelector("strong").innerText
        // find original link by name & URL
        const link = data.themes.flatMap(t => t.links).find(l => l.name === name)

        if (link) newLinks.push(link)
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
DELETE
-------------------------- */
function deleteLink(t,l){
    data.themes[t].links.splice(l,1)
    renderAdmin()
}

function setupForm() {
    const form = document.getElementById("addForm")
    if (!form) return

    form.onsubmit = e => {
        e.preventDefault()

        const themeName = document.getElementById("theme").value.trim()
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
