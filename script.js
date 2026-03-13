let data = {}

async function loadLinks() {

    const res = await fetch("links.json")
    data = await res.json()

    renderCatalogue()
    renderAdmin()

}

function favicon(url){

    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}`

}

function renderCatalogue(){

    const container = document.getElementById("catalogue")
    if(!container) return

    container.innerHTML=""

    data.themes.forEach(theme => {

        const block = document.createElement("div")

        block.innerHTML = `<h3>${theme.name}</h3>`

        theme.links.forEach(link => {

            const el = document.createElement("div")

            el.className="card mb-2 p-2"

            el.innerHTML=`

            <a href="${link.url}" target="_blank"
               class="link-card text-decoration-none"
               title="${link.description}">

                <img class="favicon" src="${favicon(link.url)}">

                ${link.name}

            </a>
            `

            block.appendChild(el)

        })

        container.appendChild(block)

    })

}

function renderAdmin(){

    const list = document.getElementById("adminList")
    if(!list) return

    list.innerHTML=""

    data.themes.forEach((theme,tIndex)=>{

        theme.links.forEach((link,lIndex)=>{

            const li=document.createElement("li")
            li.className="list-group-item d-flex justify-content-between"

            li.innerHTML=`

            ${theme.name} - ${link.name}

            <div>

            <button class="btn btn-sm btn-danger"
            onclick="deleteLink(${tIndex},${lIndex})">
            delete
            </button>

            <button class="btn btn-sm btn-secondary"
            onclick="moveUp(${tIndex},${lIndex})">
            ↑
            </button>

            <button class="btn btn-sm btn-secondary"
            onclick="moveDown(${tIndex},${lIndex})">
            ↓
            </button>

            </div>
            `

            list.appendChild(li)

        })

    })

}

function deleteLink(t,l){

    data.themes[t].links.splice(l,1)

    renderCatalogue()
    renderAdmin()

}

function moveUp(t,l){

    if(l===0) return

    const arr=data.themes[t].links

    ;[arr[l-1],arr[l]]=[arr[l],arr[l-1]]

    renderAdmin()
}

function moveDown(t,l){

    const arr=data.themes[t].links

    if(l===arr.length-1) return

    ;[arr[l+1],arr[l]]=[arr[l],arr[l+1]]

    renderAdmin()
}

const form=document.getElementById("linkForm")

if(form){

form.addEventListener("submit",e=>{

    e.preventDefault()

    const themeName=document.getElementById("theme").value
    const name=document.getElementById("name").value
    const desc=document.getElementById("description").value
    const url=document.getElementById("url").value

    let theme=data.themes.find(t=>t.name===themeName)

    if(!theme){

        theme={name:themeName,links:[]}
        data.themes.push(theme)

    }

    theme.links.push({name:name,description:desc,url:url})

    renderAdmin()

    form.reset()

})

}

loadLinks()