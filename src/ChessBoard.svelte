<svelte:options tag="chess-board"/>
<div 
  class="board-frame" 
  on:keypress="{e => console.log(e.keycode)}"
  on:dragover|preventDefault
>
  <div class="board-child board" on:dblclick="{flip}" bind:this="{boardElement}">
    {#each currentRows as row, y (y)}
	  <div class="row">
	    {#each row as sq, x (currentRows[y][x])}
		  <div
		    class="square"
			data-index="{currentRows[y][x]}"
			title="{__status !== 'SETUP' ? '' : utils.sq2san(currentRows[y][x])}"
			style="background: {currentRows[y][x] === __sqFrom ? 'lightgreen' : utils.isDarkSquare(currentRows[y][x]) ? __darkBg : __lightBg};"
			on:dragover|preventDefault
    		on:click="{e => handleInput(e, currentRows[y][x])}" 
    		on:drop|stopPropagation="{e => handleInput(e, currentRows[y][x])}" 
		  >
		    {#if ((position[currentRows[y][x]] !== '0') && __status)}
				<img 
				  src={ sets[__set][position[currentRows[y][x]]] } 
				  alt="{position[currentRows[y][x]]}"
				  width="{`${sets[__set].size}%`}" 
				  height="{`${sets[__set].size}%`}"
				  style="cursor: {canMoveFrom(currentRows[y][x]) && (__current + 2) ? 'pointer' : 'not-allowed'};"
				  draggable={canMoveFrom(currentRows[y][x]) && (__current + 2)}
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
  <div 
    class="board-child board-panel" 
	style="color: {__darkBg}; background: whitesmoke; display: {hidePanel ? 'none': 'flex'};"
	on:contextmenu="{contextMenu}"
	on:dragover|preventDefault
	on:drop|stopPropagation="{ev => {
			  __sqFrom = -1
			  __sqTo = -1
			  __figureFrom = null
			  __figureTo = null
			  __imgSrc ? __imgSrc.style.opacity = 1 : null
			  __imgSrc = null
	}}"
  >
    <div 
	  class="board-panel-child"
	  style="display: {__status === 'PLAY' || __status === 'VIEW' || __status === 'ANALYZE' ? 'flex' : 'none'};"
	>
	  <div class="hidden-inputs" bind:this={divCP}>
	    <input type="text" bind:this={txtCPFen} />
	    <input type="text" bind:this={txtCPPgn} />
	  </div> 
	  <div title={getPgn(__current)} class="headers" style="color: {__darkBg};">
	    <div class="header-row">
			<span style="color: {__lightBg}; background: {__darkBg}; padding: 4px; border-radius: 4px;">
			  {`${white} - ${black}`}
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
	  {#if __status === 'SETUP'}
	  <div style="font-weight: bold; padding-left: 5px; border-bottom: 1px solid silver;"> Setup Position</div>
	  <div class="line">
	    <span style="margin-right: 2px;">FEN</span>
		<span  
		  style="border: solid 1px; padding: 2px; background: white; color: {__darkBg}; font-size: 8.5px; font-weight: bold;"
		>
		  {`${utils.fen2obj(game.fens()[__current >= 0 ? __current : 0]).fenString} ${game.getTurn(__current)} ${game.getCastling(__current)} ${game.getEnPassant(__current)} ${game.getHalfMoveClock(__current)} ${game.getFullMoveNumber(__current)}`}
		</span>
	  </div>
	  <div class="line">
	    <div><label class="pad5">Castling Permissions</label></div>
		<div>
			{#each ['K', 'Q', 'k', 'q'] as fig}
			<img 
			  	draggable="{false}"
				src="{sets[__set][fig]}" 
				alt="{fig}"
				style="cursor: pointer; background: {game.castling.indexOf(fig) !== -1 ? __darkBg : __lightBg};"
				on:click="{() => setCastling(fig)}"
				width="30px"
				height="30px"
			>
			{/each}
		</div>
	  </div>
	  <div class="line">
	    <div><label class="pad5">Side to move</label></div>
		<div>
			{#each [{figure: 'P', side: 'w'}, {figure: 'p', side: 'b'}] as fig}
			<img 
			  	draggable="{false}"
				src="{sets[__set][fig.figure]}" 
				alt="{fig.side.toUpperCase()}"
				style="cursor: pointer; background: {turn === fig.side ? __darkBg : __lightBg};"
				on:click="{() => setTurn(fig.side)}"
				height="30px"
				width="30px"
			>
			{/each}
		</div>
	  </div>
	  <div class="line">
	    <button
			on:click="{() => {
				utils.range(0, 63).forEach(n => game.put(n, '0'))
				refresh()
			}}"
		>
		  Empty board
		</button>
	    <button
			on:click="{() => {
				utils.defaultFenArray.forEach((v,n) => game.put(n, v))
				refresh()
			}}"
		>
		  Default position
		</button>
	  </div>
	  <div class="line">
	    <div><label class="pad5">Discard figure</label></div>
		<div
		  style="width: 32px; height: 32px; border: solid 2px silver; cursor: pointer;"
		  on:dragover|preventDefault
		  on:drop|stopPropagation="{ev => {
			  game.put(__sqFrom, '0')
			  __sqFrom = -1
			  __sqTo = -1
			  __figureFrom = null
			  __figureTo = null
			  __imgSrc = null
			  refresh()
		  }}"
		  on:click|stopPropagation="{ev => {
			  if (__sqFrom < 0) return
			  game.put(__sqFrom, '0')
			  __sqFrom = -1
			  __sqTo = -1
			  __figureFrom = null
			  __figureTo = null
			  __imgSrc = null
			  refresh()
		  }}"
		>
		  <img
		  	draggable="{false}"
		    src="{trashbin}"
			alt="Trashbin"
			width="30px"
			height="30px"
			style="background: {__darkBg};"
		  />
		</div>
	  </div>
	  <div class="line">
	    <div><label class="pad5">Add figure</label></div>
		<div
		  style="display: flex; flex-direction: column; width: 180px; min-width: 180px; max-width: 180px; height: 40px; min-height: 60px; max-height: 60px; border: solid 1px silver;"
		>
		  <div
		  	style="width: 100%; height: 50%; background: red;"
		  >
		    {#each utils.range(0, 5) as i}
			  <img
			  	draggable="{true}"
				src="{sets[__set][setupImgs[i].figure]}"
				alt="{setupImgs[i].figure}"
				style="background: {__lightBg}; cursor: pointer;"
				width="30px"
				height="30px"
				on:click={e => handleInput(e, setupImgs[i].index)}
				on:dragstart={e => handleDragStart(e, setupImgs[i].index)}
			  />
			{/each}
		  </div>
		  <div
		  	style="width: 100%; height: 50%; background: steelblue;"
		  >
		    {#each utils.range(6, 11) as i}
			  <img
			  	draggable="{true}"
				src="{sets[__set][setupImgs[i].figure]}"
				alt="{setupImgs[i].figure}"
				style="background: {__darkBg}; cursor: pointer;"
				width="30px"
				height="30px"
				on:click={e => handleInput(e, setupImgs[i].index)}
				on:dragstart={e => handleDragStart(e, setupImgs[i].index)}
			  />
			{/each}
		  </div>
		</div>
	  </div>
	  <div class="line">
	    <button
		  on:click="{() => {
			  game.fen = fenCopy
			  setStatus('analyze')
			  refresh()
		  }}"
		>
		  Cancel
		</button>
	    <button
		  on:click="{() => {
			  const validFen = utils.validateFen(game.fen)
			  if (validFen.valid) { 
			  setStatus('analyze')
			  refresh()
		      DEBUG && dispatch('update', Date.now())
			  } else {
				  alert(`Current position is not valid.\n${validFen.message}`)
			  }
		  }}"
		>
		  Done
		</button>
	  </div>
	  {/if}
	</div>
	<div 
	  class="board-panel-child"
	  style="display: {__status === 'CONFIG' ? 'flex' : 'none'};"
	>
	  <h3 class="pad5" style="text-align: center; border-bottom: solid 1px silver;">
	    Appearance
	  </h3>
	  <div class="line">
	    <div><label class="pad5">Backgrounds</label></div>
		<div><select on:change="{ev => setBackgrounds(ev.target.value)}">
		  {#each backgrounds as bg}
		    <option selected="{__darkBg === bg.dark}" value="{bg.name}">{bg.name}</option>
		  {/each}
		</select></div>
	  </div>
	  <div class="line">
		<div><label class="pad5">Figure set</label></div>
		<div><select on:change="{ev => setFigureSet(ev.target.value)}">
		  {#each figureSets as s}
		    <option selected="{__set === s}" value="{s}">{utils.capitalize(s)}</option>
		  {/each}
		</select></div>
	  </div>
	  <div class="line">
	    <div><label for="chkFlipped" class="pad5">Board flipped</label></div>
		<div>
			<input style="cursor: pointer;" name="chkFlipped" type="checkbox" bind:checked="{__flipped}" />
		</div>
	  </div>
	  <h3 class="pad5" style="text-align: center; border-bottom: solid 1px silver;">
	    Options
	  </h3>
	  <div class="line">
		<div><label class="pad5">Human Plays with</label></div>
		<div>
		   <img 
   		  	 draggable="{false}"
		     src="{sets[__set].K}"
			 alt="white"
			 style="cursor: pointer; background: {__human === 'w' ? __darkBg : __lightBg};"
			 on:click="{() => setHuman('w')}"
			 title="White"
		   />
		   <img 
		  	 draggable="{false}"
		     src="{sets[__set].k}"
			 alt="black"
			 style="cursor: pointer; background: {__human === 'b' ? __darkBg : __lightBg};"
			 on:click="{() => setHuman('b')}"
			 title="Black"
		   />
		</div>
	  </div>
	  <div class="line">
		<div><label class="pad5">Automatic Promotion</label></div>
		<div><select bind:value="{autoPromotion}">
		     <option value="{false}" selected="{!autoPromotion}">None</option>
		  {#each [{name: 'Queen', value: 'Q'}, {name: 'Knight', value: 'N'}, {name: 'Rook', value: 'R'}, {name: 'Bishop', value: 'B'}] as fig}
		    <option selected="{autoPromotion === fig.value}" value="{fig.value}">{fig.name}</option>
		  {/each}
		</select></div>
	  </div>
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

	.hidden-inputs {
		display: none;
	}

	.pad5 {
		padding: 5px;
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

	.line {
		display: flex;
		width: 95%;
		min-width: 95%;
		max-width: 95%;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 5px;
		margin-bottom: 0;
		font-size: 10pt;
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
		height: 20%;
		max-height: 30%;
		min-height: 20%;
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
		height: 60%;
		max-height: 60%;
		min-height: 60%;
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
	  /* opacity: 0.5; */
	  text-shadow: 4px 4px 4px;
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
  import { onMount, onDestroy, afterUpdate, createEventDispatcher } from 'svelte'
  import Chess from 'chess-functions/dist/chess-functions.esm'
  import sets from 'chess-sets'
  import { trashbin } from '../assets/trashbin.json'

  const DEBUG = true

  export const version = '0.18.1'
  export const utils = Chess.utils()
  export let game = new Chess()	
  export const states = ['PLAY', 'VIEW', 'ANALYZE', 'CONFIG', 'SETUP']
  export const backgrounds = [
	  {name: 'Acqua', dark: '#56B6E2', light: '#DFDFDF'},
	  {name: 'Blue', dark: '#6495ED', light: '#ADD8E6'},
	  {name: 'Brown', dark: '#B58863', light: '#F0D9B5'},
	  {name: 'Green', dark: '#769656', light: 'beige'},
	  {name: 'Maroon', dark: '#B2535B', light: '#FFF2D7'}
  ]

  export let hidePanel = false
  export let initialStatus = 'ANALYZE'
  export let autoPromotion = false
  export let initialFen = Chess.defaultFen()
  export let humanSide = 'w'
  export let figureSets = []
  for (let k in sets) figureSets = [...figureSets, k]

  export let initialLightBg
  export let initialDarkBg


  const dispatch = createEventDispatcher()
  const xor_arr = (aoa, xorVal) => aoa.reduce((base, a) => [...base, a.map(v => v ^ xorVal)], [])
  const rows = utils.partition(utils.chessboard, 8) 
  const flipped_arr = xor_arr(rows, 7)
  const unflipped_arr = xor_arr(rows, 56)

  const getWhite = (n = __current) => game.headers('White')
  $: white = getWhite(__current)

  const getBlack = (n = __current) => game.headers('Black')
  $: black = getBlack(__current)

  
  let __isPromoting = false
  let __status = initialStatus
  let __human = humanSide
  let __flipped = false
  let __current = 0
  let __set = 'default'
  let __lightBg = initialLightBg || backgrounds[1].light
  let __darkBg = initialDarkBg || backgrounds[1].dark
  let boardElement 
  let historyElement
  let panelElement
  let divCP
  let txtCPFen
  let txtCPPgn
  let __imgSrc = null	
  let __figureFrom = null
  let __figureTo = null	
  let __sqFrom = -1
  let __sqTo = -1
  let __promotion = null

  
  $: currentRows = __flipped ? flipped_arr : unflipped_arr
  export const getCurrentRows = () => currentRows
  export const getStatus = () => __status
  export const setStatus = newState => {
	  if (!newState) newState = 'ANALYZE'
	  switch (newState.constructor.name) {
		  case 'String':
			  newState = newState.toUpperCase()
			  const found = states.find(s => s === newState)
			  __status = found ? found : __status
			  if (found) refresh()
			  if (__status === 'SETUP' && found) fenCopy = game.fen
			  return !!found
		  case "Number":
			  if (newState < 0 || newState >= states.length) return false
			  __status = states[newState]
			  refresh()
			  if (__status === 'SETUP') fenCopy = game.fen
			  return true
		  default: 
		    return false
	  }
  }
  export const setup = () => setStatus('setup')
  export const config = () => setStatus('config')
  export const analyze = () => setStatus('analyze')
  export const view = () => setStatus('view')
  export const play = () => setStatus('play')

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

  export const getFlipped = () => __flipped
  export const flip = () => {
	  __flipped = !__flipped
	    emit('update', Date.now())
		dispatch('update', Date.now())
	    emit('flip', __flipped)
		dispatch('flip', __flipped)
  }

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
  
  export const setGame = newGame => {
	  game = newGame
	  __current = 0
	  refresh()
  }

  $: gameTitle = game.title
  $: position = game.positions[__current < 0 ? 0 : __current]
  export const getPosition = () => position

  export const getFigureSet = () => __set
  export const setFigureSet = newSet => {
	  if (typeof newSet === 'undefined') {
		  __set = 'default'
	      DEBUG && dispatch('update', Date.now())
		  return true
	  } else {
		switch (newSet.constructor.name) {
			case 'String':
				newSet = newSet.toLowerCase()
				const found = figureSets.find(s => s === newSet)
				__set = found ? found : __set
			    !!found && DEBUG && dispatch('update', Date.now())
				return !!found
			case "Number":
				if (newSet < 0 || newSet >= figureSets.length) return false
				__set = figureSets[newSet]
		        DEBUG && dispatch('update', Date.now())
				return true
			default: 
				return false
		}
	  }
  }

  export const getBackgrounds = () => ({light: __lightBg, dark: __darkBg})
  export const setBackgrounds = options => {
	  switch (options.constructor.name) {
		  case 'String': 
			  const bg = backgrounds.find(bg => bg.name.toLowerCase() === options.toLowerCase())
			  if (bg) {
				  __lightBg = bg.light
				  __darkBg = bg.dark
			      DEBUG && dispatch('update', Date.now())
				  return true
			  } else {
				  return false
			  }
		  case 'Number':
			  if (options < 0 || options >= backgrounds.length) return false 
			  __lightBg = backgrounds[options].light
			  __darkBg = backgrounds[options].dark
		      DEBUG && dispatch('update', Date.now())
			  return true
		  case 'Object':
			  if (options.light && options.dark) {
				  __lightBg = options.light
				  __darkBg = options.dark
			      DEBUG && dispatch('update', Date.now())
				  return true
			  } else {
				  return false
			  }
		  default:
			  return false
  	}
  }
  
  $: castling = game.getCastling(__current >= 0 ? __current : 0)

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

  const promotePawn = promotion => {
	  __promotion = promotion.toUpperCase()
	  __isPromoting = false
	  try_move(__sqFrom, __sqTo, __promotion)
  }

  
  export const refresh = () => {
	// Refreshes by dobuble flipping  
	//setTimeout(() => flip(), 50)
	//setTimeout(() => flip(), 60)

	// ... but is better to move current pointer
	 const curcur = __current
	 setTimeout(() => __current = -1, 10)
	 setTimeout(() => __current = curcur, 15)
	 return curcur

  }
  
  export const pasteFen = () => {
	  try {
		  navigator.clipboard.readText()
		  .then(fen => {
			  if (utils.validateFen(fen).valid) {
				  DEBUG && console.log('Successfully updated game to ' + fen)
				  reset(fen)
			  } else {
				  DEBUG && console.log(`${fen} is not a valid FEN position`)
			  }
		  })
	  } catch(e) {
		  DEBUG && console.log('CLIPBOARD ERROR:' + e.message)
	  }
  }

  export const copyFen = () => {
	  try {
		  navigator.clipboard.writeText(game.fens()[__current])
		  .then(() => DEBUG && console.log('Clipboard successfully set.'), 
		        () => DEBUG && console.log('Something went very wrong and couldn\'t update the clipboard.'))
	  } catch(e) {
		  DEBUG && console.log(`Error copying FEN to clipboard: ${e.message}`)
	  }
  }
  
  export const pastePgn = () => {
	  try {
		  navigator.clipboard.readText()
		  .then(pgn => {
			  if (load_pgn(pgn)) {
				  DEBUG && console.log('Successfully updated game with clipboard PGN data')
			  } else {
				  DEBUG && console.log(`Provided PGN could not be loaded`)
			  }
		  })
	  } catch(e) {
		  DEBUG && console.log('CLIPBOARD ERROR:' + e.message)
		  try {
			  txtCPPgn.focus()
			  txtCPPgn.select()
			  document.execCommand('paste')
			  setTimeout(() => {
				if (load_pgn(txtCPPgn.value)) {
					DEBUG && console.log('Successfully updated game with clipboard PGN data via "document.execCommand"')
				} else {
					DEBUG && console.log(`Provided PGN could not be loaded by "document.execCommand", either`)
				}
			  }, 0)
		  } catch(e) {
			  DEBUG && console.log('document.exeCommand also fails: ' + e.message)
		  }
	  }
  }
 
  export const copyPgn = () => {
	  try {
		  navigator.clipboard.writeText(game.pgn())
		  .then(() => DEBUG && console.log('Clipboard successfully set.'), 
		        () => DEBUG && console.log('Something went very wrong and couldn\'t update the clipboard.'))
	  } catch(e) {
		  DEBUG && console.log(`Error copying PGN to clipboard: ${e.message}`)
	  }
  }



  export const remote_move = (...args) => {
	const response = game.move(...args)
	if (response) {
		__current = game.history().length
//		doubleFlip()
		setTimeout(() => historyElement.scrollTop = historyElement.scrollHeight, 0)
		DEBUG && dispatch('update', Date.now())
		dispatch('move', game.history()[game.history().length - 1])
		emit('move', game.history()[game.history().length - 1])
		examineStatus()
	}
	return response
  }
  
  export let isCheck
  export let isCheckMate
  $: isCheck = getCheck()
  $: isCheckMate = getCheckMate()

  $: if (getCheck()) isCheck = true
  $: if (getCheckMate()) isCheckMate = true
  
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
		DEBUG && dispatch('update', Date.now())
		dispatch('move', game.history()[game.history().length - 1])
		emit('move', game.history()[game.history().length - 1])
		examineStatus()
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
		dispatch('undo', game.history().length)
		emit('undo', game.history().length)
		examineStatus()

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

  export let now
  $: now = (() => Date.now())()

  export const getHistory = (n = 0) => game.numbered_history()
  $: history = getHistory(__current)

  export const getResult = (n = 0) => game.headers('Result')
  $: result = getResult(__current)

  $: turn = game.getTurn(__current)

  export const getPgn = (n = getCurrent()) => game.pgn()

  export const canMoveFrom = sq => {
	if (utils.isEmptyFigure(game.position[sq])) {
		return false
	}

	if (__current !== game.history().length) {
		// console.log('Not at final position')
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

  const setupImgs = [
	  {figure: 'p', index: -10},
	  {figure: 'n', index: -20},
	  {figure: 'b', index: -30},
	  {figure: 'r', index: -40},
	  {figure: 'q', index: -50},
	  {figure: 'k', index: -60},
	  {figure: 'P', index: -110},
	  {figure: 'N', index: -120},
	  {figure: 'B', index: -130},
	  {figure: 'R', index: -140},
	  {figure: 'Q', index: -150},
	  {figure: 'K', index: -160},
  ]


  const handleDragStart = (ev, sq)	=> {
	  __imgSrc = ev.target
	  if(sq >= 0) ev.target.style.opacity = 0.1
	  if (navigator.userAgent.match(/Firefox|Edge/)) {
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
      }
	  handleInput(ev, sq)
  }

  const handleInput = (ev, sq) => {
	  if (__sqFrom === -1) {
		  if (canMoveFrom(sq)) {
			  __sqFrom = sq
			  __figureFrom = sq >= 0 ? game.position[sq] : setupImgs.find(i => i.index === sq).figure
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
			  if (__status !== 'SETUP') {
				  try_move(__sqFrom, __sqTo)
			  } else {
				  game.put(__sqFrom, '0')
				  game.put(__sqTo, __figureFrom)
				__sqFrom = -1
				__sqTo = -1
				__figureFrom = null
				__figureTo = null
				__imgSrc = null
				refresh()
			  }
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

  const contextMenu = ev => console.log('Context menu invoked.')

  export const getCastlingIndex = fig => {
	  switch (fig) {
		  case 'K':
			  return 0
		  case 'Q':
			  return 1
		  case 'k':
			  return 2
		  case 'q':
			  return 3
		  default:
			  return -1
	  }
  }

  export let fenCopy = utils.defaultFen

  export const setTurn = t => {
	  let obj = utils.fen2obj(game.fen)
	  obj.turn = t
	  game.fen = utils.obj2fen(obj)
	  refresh()
  }

  export const setCastling = fig => {
	  let obj = utils.fen2obj(game.fen)
	  const ccastling = obj.castling
	  let currCastling = [
		  ccastling.indexOf('K') !== -1 ? 'K' : '-',
		  ccastling.indexOf('Q') !== -1 ? 'Q' : '-',
		  ccastling.indexOf('k') !== -1 ? 'k' : '-',
		  ccastling.indexOf('q') !== -1 ? 'q' : '-',
	  ]
	  const index = currCastling.findIndex(f => f === fig)
	  if (index !== -1) {
		  currCastling[index] = '-'
	  } else {
		  currCastling[getCastlingIndex(fig)] = fig
	  }

	  let newCastling = currCastling.filter(x => x !== '-').join('')
	  newCastling = newCastling.length ? newCastling : '-'
	  obj.castling = newCastling
	  game.fen = utils.obj2fen(obj)
	  refresh()
  }

///////////////////////////////////////////////////////////////////////////////
  const prevDefault = e => e.preventDefault()

  const dropOut = e => {
		DEBUG && console.log("Dropping out of the board!!")
		__sqFrom = -1
		__sqTo = -1
		__figureFrom = null
		__figureTo = null
		__imgSrc ? __imgSrc.style.opacity = 1 : null
		__imgSrc = null
  }

  onDestroy(() => {
	  document.body.removeEventListener('dragover', prevDefault)
	  document.body.addEventListener('drop', dropOut)
  })
  
  onMount(() => {
	game.reset(initialFen)
    document.body.addEventListener('dragover', prevDefault) 
    document.body.addEventListener('drop', dropOut)
  })

  afterUpdate(() => {
	  emit('update', `Updated at ${new Date().toLocaleTimeString()}`)
	  dispatch('update', `Updated at ${new Date().toLocaleTimeString()}`)
  })

  let eventHandlers = {
	  'update': [],
	  'move': [],
	  'undo': [],
	  'check': [],
	  'checkmate': [],
	  'stalemate': [],
	  'in_fifty_moves_rule': [],
	  'in_threefold_repetition': [],
	  'insufficient_material': [],
	  'in_draw': [],
	  'flip': []
  }

  const exclude = (a, n) => [...a.slice(0, n), ...a.slice(n + 1)]
  // return (() => eventHandlers[evName] = exclude(eventHandlers[evName], eventHandlers[evName].length - 1))

  export const on = (evName, handler) => {
	  if (!(evName in eventHandlers)) return null
	  if (!handler || handler.constructor.name !== 'Function') return null
	  const now = Date.now()
	  handler.timestamp = now
	  eventHandlers[evName] = [...eventHandlers[evName], handler]
      return (() => {
		  eventHandlers[evName] = eventHandlers[evName].filter(h => h.timestamp !== now)
		  return eventHandlers[evName].length
	  })     
  }

  const emit = (ev, detail = undefined) => {
	  if (!ev in eventHandlers) return
	  setTimeout(() => {
		  eventHandlers[ev].forEach(h => h({type: ev, detail, timestamp: Date.now()}))
	  }, 0)
  }

  const examineStatus = () => {
	  if (game.isCheck && !game.isCheckMate) {
		  emit('check', game.turn)
		  dispatch('check', game.turn)
	  }
	  if (game.isCheckMate) {
		  emit('checkmate', getResult())
		  dispatch('checkmate', getResult())
	  }
	  if (game.isStaleMate) {
		  emit('stalemate', getResult())
		  dispatch('stalemate', getResult())
	  }
	  if (game.in_fifty_moves_rule) {
		  emit('in_fifty_moves_rule', getResult())
		  dispatch('in_fifty_moves_rule', getResult())
	  }
	  if (game.in_threefold_repetition) {
		  emit('in_threefold_repetition', getResult())
		  dispatch('in_threefold_repetition', getResult())
	  }
	  if (game.insufficient_material) {
		  emit('insufficient_material', getResult())
		  dispatch('insufficient_material', getResult())
	  }
	  if (game.in_draw) {
		  emit('in_draw', getResult())
		  dispatch('in_draw', getResult())
	  }
  }

</script>

