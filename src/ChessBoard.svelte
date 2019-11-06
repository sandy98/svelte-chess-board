<svelte:options tag="chess-board"/>
<div class="board-frame" on:keypress="{e => console.log(e.keycode)}">
  <div class="board-child board" on:dblclick="{flip}" bind:this="{boardElement}">
    {#each currentRows as row, y (y)}
	  <div class="row">
	    {#each row as sq, x (currentRows[y][x])}
		  <div
		    class="square"
			data-index="{currentRows[y][x]}"
			title="{utils.sq2san(currentRows[y][x])}"
			style="background: {currentRows[y][x] === __sqFrom ? 'lightgreen' : utils.isDarkSquare(currentRows[y][x]) ? __darkBg : __lightBg};"
			on:dragover|preventDefault
    		on:click="{e => handleInput(e, currentRows[y][x])}" 
    		on:drop="{e => handleInput(e, currentRows[y][x])}" 
		  >
		    {#if (position[currentRows[y][x]] !== '0')}
				<img 
				  src={ sets[__set][position[currentRows[y][x]]] } 
				  alt="{position[currentRows[y][x]]}"
				  width="{`${sets[__set].size}%`}" 
				  height="{`${sets[__set].size}%`}"
				  style="cursor: {canMoveFrom(currentRows[y][x]) && turn ? 'pointer' : 'not-allowed'};"
				  draggable={canMoveFrom(currentRows[y][x]) && turn}
				  on:dragstart="{e => handleDragStart(e, currentRows[y][x])}" 
				/>
			{/if}
		  </div>
		{/each}
	  </div>
	{/each} 
	<div 
	  class="promotion-panel"
	  bind:this={panelElement}
	  style="display: {__isPromoting ? 'flex' : 'none'};"
	>
	  {#each promotionSet as fig, i}
        <div on:click="{() => promotePawn(fig)}">
		  <img 
		    src="{sets[__set][fig]}" 
			alt="{fig}"
			width="{sets[__set].size}%" 
			height="{sets[__set].size}%" 
		  />
		</div>
	  {/each}
	</div>
  </div>
  <div class="board-child board-panel" style="color: {__darkBg}; background: beige;">
    <div 
	  class="board-panel-child"
	  style="display: {__status === 'PLAY' || __status === 'VIEW' || __status === 'ANALYZE' ? 'flex' : 'none'};"
	>
	  <div class="headers" style="color: {__darkBg};">
	    <div class="header-row">
			<span style="color: {__lightBg}; background: {__darkBg}; padding: 4px; border-radius: 4px;">
			  {`${game.headers('White')} - ${game.headers('Black')}`}
			</span>
			<span style="color: {__lightBg}; background: {__darkBg}; padding: 4px; border-radius: 4px;">
			  {result}
			</span>			
		</div>
	  </div>
	  <div 
	    class="history" 
		bind:this={historyElement}
	  >
	    <span
		 class="san"
		 style="background: {__current === 0 ? __darkBg : __lightBg}; border: {__current === 0 ? 'none' : 'dashed 1px'};"
		 on:click="{() => goto(0)}"
		>
		  &nbsp;
		</span>

		{#each history as san, i}
	    <span
		 class="san"
		 style="background: {__current === (i + 1) ? __darkBg : 'inherit'}; color: {__current === (i + 1) ? __lightBg : __darkBg};"
		 on:click="{() => goto(i + 1)}"
		>
		  {san}
		</span>
		{/each}

	    <span
		 class="san"
		 on:click="{() => goto(history.length)}"
		>
			{result}
		</span>

	  </div>
	</div>
	<div 
	  class="board-panel-child"
	  style="display: {__status === 'SETUP' ? 'flex' : 'none'};"

	>
	  <h2 style="padding: 5px;"> Setup</h2>
	</div>
	<div 
	  class="board-panel-child"
	  style="display: {__status === 'CONFIG' ? 'flex' : 'none'};"

	>
	  <h2 style="padding: 5px;"> Config</h2>
	</div>
  </div>
</div>

<style>

	/* width */
	::-webkit-scrollbar {
	width: 7px;
	}

	/* Track */
	::-webkit-scrollbar-track {
	background: #f1f1f1;
	}

	/* Handle */
	::-webkit-scrollbar-thumb {
	background: #bbb;
	}

	/* Handle on hover */
	::-webkit-scrollbar-thumb:hover {
	background: #888;
	}

	.board-frame {
		display: flex;
		flex-direction: column;
		width: 320px;
		max-width: 320px;
		min-width: 320px;
		height: 640px;
		max-height: 640px;
		min-height: 640px;
        -webkit-user-select:none; 
        -webkit-touch-callout:none; 
        -moz-user-select:none; 
        -ms-user-select:none; 
        user-select:none;    		
	}

	.board-child {
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		height: 50%;
		max-height: 50%;
		min-height: 50%;
		margin-top: 0;
		border: solid 1px black;
	}

	.board {
		display: flex;
		flex-direction: column;
		background: steelblue;
		color: whitesmoke;
	}

	.row {
		display: flex;
		flex-direction: row;
		height: 12.5%;
		min-height: 12.5%;
		max-height: 12.5%;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
	}

	.row:nth-child(even) {
		background: whitesmoke;
	}

	.row:nth-child(odd) {
		background: cyan;
	}
	
	.square {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		min-height: 100%;
		max-height: 100%;
		width: 12.5%;
		max-width: 12.5%;
		min-width: 12.5%;
	}

	.board-panel-child {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		height: 100%;
		max-height: 100%;
		min-height: 100%;
	}

	.headers {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-content: space-around;
		align-items: center;
		padding: 5px;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		height: 10%;
		max-height: 10%;
		min-height: 10%;
		border-bottom: solid 1px silver;
	}

	.header-row {
		display: flex;
		width: 90%;
		flex-direction: row;
		justify-content: space-between;
	}

	.history {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: flex-start; 
		justify-items: flex-start;
		align-content: flex-start;
		width: 95%;
		max-width: 95%;
		min-width: 95%;
		height: 80%;
		max-height: 80%;
		min-height: 80%;
		overflow-y: auto;
		font-family: monospace;
		font-size: 10pt;
		padding: 5px;
	}

	.san {
		cursor: pointer;
		padding: 3px;
		padding-bottom: 5px;
		height: 0.75em;
		max-height: 0.75em;
		min-height: 0.75em;
		margin-right: 0.35em;
		margin-bottom: 8px;
	}

	.san:hover {
		opacity: 0.5;
	}

	.promotion-panel {
		position: absolute;
		flex-direction: row;
		z-index: 1000;
		width: 160px;
		min-width: 160px;
		max-width: 160px;
		height: 40px;
		min-height: 40px;
		max-height: 40px;
		border: solid 1px black;
	}

	.promotion-panel>div {
		width: 25%;
		min-width: 25%;
		max-width: 25%;
		height: 100%;
		min-height: 100%;
		max-height: 100%;
	}

	@media only screen and (min-width: 640px) {
		.board-frame {
			flex-direction: row;
			width: 640px;
			max-width: 640px;
			min-width: 640px;
			height: 320px;
			max-height: 320px;
			min-height: 320px;
			margin-top: 20px;
			margin-left: 20px;
		}

		.board-child {
			width: 50%;
			max-width: 50%;
			min-width: 50%;
			height: 100%;
			max-height: 100%;
			min-height: 100%;
		}
	}

	@media only screen and (min-width: 1280px) {
		.board-frame {
			width: 800px;
			max-width: 800px;
			min-width: 800px;
			height: 400px;
			max-height: 400px;
			min-height: 400px;
		}

		.promotion-panel {
			width: 200px;
			min-width: 200px;
			max-width: 200px;
			height: 50px;
			min-height: 50px;
			max-height: 50px;
		}
	}

	@media only screen and (min-width: 1600px) {
		.board-frame {
			width: 960px;
			max-width: 960px;
			min-width: 960px;
			height: 480px;
			max-height: 480px;
			min-height: 480px;
		}

		.promotion-panel {
			width: 240px;
			min-width: 240px;
			max-width: 240px;
			height: 60px;
			min-height: 60px;
			max-height: 60px;
		}

	}

</style>

<script>
  import { onMount } from 'svelte'
  import Chess from 'chess-functions/dist/chess-functions.esm'
  import sets from 'chess-sets'
  
  export const utils = Chess.utils()
 
  export let initialFen = Chess.defaultFen()
 
  export const game = new Chess(initialFen)	

  export let autoPromotion = false

  let __isPromoting = false

  export const states = ['PLAY', 'VIEW', 'ANALYZE', 'CONFIG', 'SETUP']
  export let initialStatus = 'ANALYZE'
  let __status = initialStatus
  export const getStatus = () => __status
  export const setStatus = newState => {
	  switch (newState.constructor.name) {
		  case 'String':
			  newState = newState.toUpperCase()
			  const found = states.find(s => s === newState)
			  __status = found ? found : __status
			  if (found) refresh()
			  return !!found
		  case "Number":
			  if (newState < 0 || newState >= states.length) return false
			  __status = states[newState]
			  refresh()
			  return true
		  default: 
		    return false
	  }
  }

  export let humanSide = 'w'
  let __human = humanSide
  export const getHuman = () => __human
  export const setHuman = h => {
	  if (/[wb]/i.test(h)) {
		  __human = h.toLowerCase()
		  refresh()
		  return true
	  } else {
		  return false
	  }
  }

  const xor_arr = (aoa, xorVal) => aoa.reduce((base, a) => [...base, a.map(v => v ^ xorVal)], [])
  const rows = utils.partition(utils.chessboard, 8) 
  const flipped_arr = xor_arr(rows, 7)
  const unflipped_arr = xor_arr(rows, 56)

  $: currentRows = __flipped ? flipped_arr : unflipped_arr
  export const getCurrentRows = () => currentRows

  let __flipped = false
  export const getFlipped = () => __flipped
  export const flip = () => __flipped = !__flipped

  let __current = 0
  export const getCurrent = () => __current
  export const goto = n => {
	  if (__status !== 'ANALYZE' && __status !== 'VIEW') return -1
	  n = n < 0 ? 0 : n > game.history().length ? game.history().length : n
	  if (__current !== n) {
	  	__current = n
//		doubleFlip()
	  }
	  return n
  }
  
  export let gameTitle
  $: gameTitle = game.title

  $: position = game.positions[__current < 0 ? 0 : __current]
  export const getPosition = () => position

  export let figureSets = []
  for (let k in sets) figureSets = [...figureSets, k]
  let __set = 'default'
  export const getFigureSet = () => __set
  export const setFigureSet = newSet => {
	  if (typeof newSet === 'undefined') {
		  __set = 'default'
		  return true
	  } else {
		switch (newSet.constructor.name) {
			case 'String':
				newSet = newSet.toLowerCase()
				const found = figureSets.find(s => s === newSet)
				__set = found ? found : __set
				return !! found
			case "Number":
				if (newSet < 0 || newSet >= figureSets.length) return false
				__set = figureSets[newSet]
				return true
			default: 
				return false
		}
	  }
  }


  export const backgrounds = [
	  {name: 'Blue', dark: '#6495ED', light: '#ADD8E6'},
	  {name: 'Brown', dark: '#B58863', light: '#F0D9B5'},
	  {name: 'Acqua', dark: '#56B6E2', light: '#DFDFDF'},
	  {name: 'Green', dark: '#769656', light: 'beige'},
	  {name: 'Maroon', dark: '#B2535B', light: '#FFF2D7'}
  ]
  let __lightBg = backgrounds[0].light
  let __darkBg = backgrounds[0].dark
  export const getBackgrounds = () => ({light: __lightBg, dark: __darkBg})
  export const setBackgrounds = options => {
	  switch (options.constructor.name) {
		  case 'String': 
			  const bg = backgrounds.find(bg => bg.name.toLowerCase() === options.toLowerCase())
			  if (bg) {
				  __lightBg = bg.light
				  __darkBg = bg.dark
				  return true
			  } else {
				  return false
			  }
		  case 'Number':
			  if (options < 0 || options >= backgrounds.length) return false 
			  __lightBg = backgrounds[options].light
			  __darkBg = backgrounds[options].dark
		  case 'Object':
			  if (options.light && options.dark) {
				  __lightBg = options.light
				  __darkBg = options.dark
				  return true
			  } else {
				  return false
			  }
		  default:
			  return false
  	}
  }
  
  $: promotionBg = utils.isDarkSquare(__sqTo || 0) ? __darkBg : __lightBg

  $: promotionSet = __figureFrom === 'P' ? ['Q', 'N', 'R', 'B'] : ['q', 'n', 'r', 'b']

  $: if (!!boardElement) {
	  if (!!panelElement) {
		// console.log('boardElement and panelElement exist!')
		panelElement.style.top = getPanelTop() + 'px'
		panelElement.style.left = getPanelLeft() + 'px'
		panelElement.style.background = promotionBg
	  }
  }
  
  $: if (__isPromoting) {
		panelElement.style.top = getPanelTop() + 'px'
		panelElement.style.left = getPanelLeft() + 'px'
  }

 const  getPanelProp = (prop = 'offsetLeft') => {
	 if (!boardElement) return -1000
	 if (!panelElement) return -1000
	 if (!__isPromoting) return -1000
	 if (__sqFrom === -1 || __sqTo === -1 || !__figureFrom)  return -1000
	 let base
	 const sqWidth = boardElement.offsetWidth / 8
	 if (prop === 'offsetLeft') {
		 base = boardElement.offsetLeft
		 const column = __flipped ? utils.col(__sqTo) ^ 7 : utils.col(__sqTo)
		 return base + sqWidth * column
	 } else if (prop === 'offsetTop') {
		 base = boardElement.offsetTop
		 const row = __flipped ? utils.row(__sqTo) : utils.row(__sqTo) ^ 7
		 return base + sqWidth * row
	 } else {
		 return -1000
	 }
 }
 
  const getPanelLeft = () => getPanelProp('offsetLeft')
  const getPanelTop = () => getPanelProp('offsetTop')

  export let boardElement 
  export let historyElement
  export let panelElement

  const promotePawn = promotion => {
	  __promotion = promotion.toUpperCase()
	  __isPromoting = false
	  try_move(__sqFrom, __sqTo, __promotion)
  }

  
  export const refresh = () => {
	// Refreshes by dobuble flipping  
	setTimeout(() => flip(), 50)
	setTimeout(() => flip(), 60)
  }
  


  export const remote_move = (...args) => {
	const response = game.move(...args)
	if (response) {
		__current = game.history().length
//		doubleFlip()
		setTimeout(() => historyElement.scrollTop = historyElement.scrollHeight, 0)
	}
	return response
  }
  
  export let isCheck
  export let isCheckMate
  $: isCheck = getCheck()
  $: isCheckMate = getCheckMate()

  export const getCheck = () => game.isCheck
  export const getCheckMate = () => game.isCheckMate

  export const try_move = (...args) => {
	if (args.length > 1) {
		if (/p/i.test(__figureFrom)) {
			if (utils.isPawnPromotion(args[0] || __sqFrom, 
				args[1] || __sqTo, 
				__figureFrom === 'P' ? 'w' : 'b') && 
				utils.canMove(game.fen, args[0] || __sqFrom , args[1] || __sqTo)) {
				const prom = args[2] || __promotion
				if (prom) {
					args[2] = prom
				} else if (autoPromotion) {
					args[2] = autoPromotion
				} else {
					//console.log(`Can't promote pawn in ${utils.sq2san(args[0])} in square ${utils.sq2san(args[1])} without a promoting figure defined`)
					if (__imgSrc) {
						__imgSrc.style.opacity = 1
						__imgSrc = null
					}
					__isPromoting = true
					return false
				}
			}
		}
	}  
	const response = game.move(...args)
	if (response) {
		__current = game.history().length
		// doubleFlip()
		setTimeout(() => historyElement.scrollTop = historyElement.scrollHeight, 0)
	}

	if (__imgSrc) {
		//console.log('Restoring source image opacity')
		__imgSrc.style.opacity = 1
	}
	__sqFrom = -1
	__sqTo = -1
	__figureFrom = null
	__figureTo = null
	__promotion = null
	__imgSrc = null

	return response
  }

  export const undo = () => {
	  if (__status !== 'ANALYZE') return false
	  const response = game.undo()
	  if (response) {
		  setTimeout(() => __current = game.history().length, 0)
		  // doubleFlip()
	  }
	  return response
  }

  export const reset = (fen = Chess.defaultFen()) => {
	  if (__status !== 'ANALYZE') return false
	  const response = game.reset(fen)
	  if (response) {
		 __current = -1 
		 if (__imgSrc) {
			 __imgSrc.style.opacity = 1
			 __imgSrc = null
		 }
		 __sqFrom = -1
		 __sqTo = -1
		 __figureFrom = null
		 __figureTo = null
		 __promotion = null
		 __imgSrc = null
		  setTimeout(() => {
			  __current = game.history().length
			  refresh()
		  }, 0)
	  }
	  return response
  }

  export const getHistory = (n = 0) => game.numbered_history()
  $: history = getHistory(__current)

  export const getResult = (n = 0) => game.headers('Result')
  $: result = getResult(__current)

  export let turn
  export const getTurn = (n = 0) => game.turn
  $: turn = getTurn(__current)

  export const canMoveFrom = sq => {
	if (__current !== game.history().length) {
		// console.log('Not at final position')
		return false
	}

	if (utils.isEmptyFigure(game.position[sq])) {
		return false
	}

	if (__status === 'VIEW') {
		// console.log('None move is allowed if you are a viewer')
		return false
	}

	if (__status === 'SETUP') {
		// console.log('Everything is allowed while doing setup')
		return true
	}
	
	// return !!game.moves(sq).length	

	sq = utils.sqNumber(sq)

	if (__status === 'PLAY') {
		if ((__human === 'w' && utils.isBlackFigure(game.position[sq])) || 
			(__human === 'b' && utils.isWhiteFigure(game.position[sq]))) {
			return false
		} else {
			return true
		}
	}

	if ((game.turn === 'w' && utils.isBlackFigure(game.position[sq])) || 
	    (game.turn === 'b' && utils.isWhiteFigure(game.position[sq]))) {
		  return false
	}
	return true
  }

  export let __imgSrc = null	
  export let __figureFrom = null
  export let __figureTo = null	
  export let __sqFrom = -1
  export let __sqTo = -1
  export let __promotion = null

  const handleDragStart = (ev, sq)	=> {
	  __imgSrc = ev.target
	  ev.target.style.opacity = 0.1
	//  if (navigator.userAgent.match(/Firefox|Edge/)) {
      //console.log(navigator.userAgent)
	  let img = new Image()
	  img.style.opacity = 1
	  //let img = document.createElement('img')
	  let width = ev.target.parentElement.clientWidth
	  let distance = width / 2
	  img.src = ev.target.src
	  let canvas = document.createElement("canvas")
	  let ctx = canvas.getContext("2d")
	  ctx.canvas.width = width
	  ctx.canvas.height = width
	  ctx.drawImage(img, 0, 0, width, width)
	  img.src = canvas.toDataURL()
	  if (ev.dataTransfer.setDragImage) {
		ev.dataTransfer.setDragImage(img, distance, distance)
	  } else if (ev.dataTransfer.addElement) {
		ev.dataTransfer.addElement(img)  
	  }
//    }
	  handleInput(ev, sq)
  }

  const handleInput = (ev, sq) => {
	  if (__sqFrom === -1) {
		  if (canMoveFrom(sq)) {
			  __sqFrom = sq
			  __figureFrom = game.position[sq]
			  //console.log('Assigned sqFrom to ' + __sqFrom)
			  return true
		  } else {
			  //console.log('No se puede mover desde la casilla ' + sq)
			  return false
		  }
	  } else {
		  if (__sqFrom === sq) {
			  if (__imgSrc) {
				  //console.log('Restoring opacity in source image')
				  __imgSrc.style.opacity = 1
			  }
			  __sqFrom = -1
			  __sqTo = -1
			  __figureFrom = null
			  __figureTo = null
			  __imgSrc = null
			  // doubleFlidoubleFlip()
			  //console.log('Anulando el movimiento')
			  return false
		  } else {
			  __sqTo = sq
			  __figureTo = game.position[sq]
			  //console.log(`Movimiento intentado: ${__sqFrom} a ${__sqTo}`)
			  try_move(__sqFrom, __sqTo)
		  }
	  }
  }

  export const load_pgn = pgn => {
	  if (__status !== 'VIEW' && __status !== 'ANALYZE') return false
	  const ret = game.load_pgn(pgn)
	  if (ret) {
		  setTimeout(() => goto(game.history().length), 0)
		  setTimeout(() => goto(0), 1)
	  }
	  return ret
  }

///////////////////////////////////////////////////////////////////////////////

  onMount(() => {
    console.log(`Board mounted with version: ${game.version}`)
    // setStatus('PLAY')
	setTimeout(() => window.board = document.querySelector('chess-board'), 0)
  })

</script>

