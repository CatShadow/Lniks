const DATA_URL = "links.json"

let data
let jsonSha = null

async function loadLinks(){
	const res = await fetch(DATA_URL)
	data = await res.json()
	renderCatalogue()
	renderAdmin()
}

function favicon(url){
	try{
		const domain = new URL(url).hostname
		return "https://www.google.com/s2/favicons?domain="+domain
	}catch{
		return ""
	}
}

function renderCatalogue(){
	const container=document.getElementById("themes")
	if(!container) return
	container.innerHTML=""
	data.themes.forEach(theme=>{
		const block=document.createElement("div")
		block.className="mb-3"
		const title=document.createElement("div")
		title.className="theme-title h4"
		title.textContent=theme.name
		const list=document.createElement("div")
		theme.links.forEach(link=>{
			const el=document.createElement("div")
			el.className="link"
			el.innerHTML=`
			<img class="favicon" src="${favicon(link.url)}">
			<a
			href="${link.url}"
			target="_blank"
			title="${link.description}"
			>
			${link.name}
			</a>
			`
			list.appendChild(el)
		})
		title.onclick=()=>{
			list.classList.toggle("d-none")
		}
		block.appendChild(title)
		block.appendChild(list)
		container.appendChild(block)
	})
	initSearch()

}

function initSearch(){
	const input=document.getElementById("search")
	if(!input) return
	input.oninput=()=>{
		const q=input.value.toLowerCase()
		document.querySelectorAll(".link").forEach(link=>{
			link.style.display =
			link.innerText.toLowerCase().includes(q) ? "flex" : "none"
		})
	}
}

function renderAdmin(){
	const container=document.getElementById("adminThemes")
	if(!container) return
	container.innerHTML=""
	data.themes.forEach((theme,tIndex)=>{
		const block=document.createElement("div")
		block.innerHTML=`<h4>${theme.name}</h4>`
		const list=document.createElement("ul")
		list.className="list-group mb-3"
		theme.links.forEach((link,lIndex)=>{
			const li=document.createElement("li")
			li.className="list-group-item"
			li.innerHTML=`
			${link.name}
			<button
			class="btn btn-sm btn-danger float-end"
			onclick="deleteLink(${tIndex},${lIndex})"
			>
			x
			</button>
			`
			list.appendChild(li)
		})
		block.appendChild(list)
		container.appendChild(block)
		new Sortable(list,{
			animation:150,
			onEnd:()=>{
				updateOrder(list,tIndex)
			}
		})
	})
}

function updateOrder(list,tIndex){
	const names=[...list.children].map(li=>li.innerText.trim())
	data.themes[tIndex].links.sort((a,b)=>{
		return names.indexOf(a.name)-names.indexOf(b.name)
	})
}

function deleteLink(t,l){
	data.themes[t].links.splice(l,1)
	renderAdmin()
}

const form=document.getElementById("addForm")

if(form){
	form.onsubmit=e=>{
		e.preventDefault()
		
		const themeName=document.getElementById("theme").value
		const name=document.getElementById("name").value
		const description=document.getElementById("description").value
		const url=document.getElementById("url").value
		
		let theme=data.themes.find(t=>t.name===themeName)
		
		if(!theme){
			theme={name:themeName,links:[]}
			data.themes.push(theme)
		}
		theme.links.push({name,description,url})
		renderAdmin()
		form.reset()
	}

}

async function saveToGitHub(){
	const repo="CatShadow/Lniks"
	const token=prompt("GitHub token")
	const url=`https://api.github.com/repos/${repo}/contents/links.json`
	const get=await fetch(url)
	const file=await get.json()
	const sha=file.sha
	await fetch(url,{
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
	alert("Saved")
}

const save=document.getElementById("saveBtn")

if(save){
	save.onclick=saveToGitHub
}

loadLinks()

