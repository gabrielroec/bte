import Modals from '@archetype-themes/modules/modal'
import YouTube from '@archetype-themes/utils/youtube'
import VimeoPlayer from '@archetype-themes/utils/vimeo'
import { loadScript } from '@archetype-themes/utils/resource-loader'
import { EVENTS, subscribe } from '@archetype-themes/utils/pubsub'

// Video modal will auto-initialize for any anchor link that points to YouTube
// MP4 videos must manually be enabled with:
//   - .product-video-trigger--mp4 (trigger button)
//   - .product-video-mp4-sound video player element (cloned into modal)
//     - see media.liquid for example of this
export default async function videoModal(scope) {
  let youtubePlayer
  let vimeoPlayer

  let videoHolderId = 'VideoHolder'
  let selectors = {
    youtube: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]',
    vimeo: 'a[href*="player.vimeo.com/player/"], a[href*="vimeo.com/"]',
    mp4Trigger: '.product-video-trigger--mp4',
    mp4Player: '.product-video-mp4-sound'
  }

  let el = scope || document
  let youtubeTriggers = el.querySelectorAll(selectors.youtube)
  let vimeoTriggers = el.querySelectorAll(selectors.vimeo)
  let mp4Triggers = el.querySelectorAll(selectors.mp4Trigger)

  if (!youtubeTriggers.length && !vimeoTriggers.length && !mp4Triggers.length) {
    return
  }

  let videoHolderDiv = document.getElementById(videoHolderId)

  if (youtubeTriggers.length) {
    await loadScript('https://www.youtube.com/iframe_api')
  }

  if (vimeoTriggers.length) {
    await loadScript('https://player.vimeo.com/api/player.js')
    window.vimeoApiReady()
  }

  let modal = new Modals('VideoModal', 'video-modal', {
    closeOffContentClick: true,
    bodyOpenClass: ['modal-open', 'video-modal-open'],
    solid: true
  })

  youtubeTriggers.forEach((btn) => {
    btn.removeEventListener('click', triggerYouTubeModal)
    btn.addEventListener('click', triggerYouTubeModal)
  })

  vimeoTriggers.forEach((btn) => {
    btn.removeEventListener('click', triggerVimeoModal)
    btn.addEventListener('click', triggerVimeoModal)
  })

  mp4Triggers.forEach((btn) => {
    btn.removeEventListener('click', triggerMp4Modal)
    btn.addEventListener('click', triggerMp4Modal)
  })

  document.removeEventListener('modalClose.VideoModal', closeVideoModal)
  document.addEventListener('modalClose.VideoModal', closeVideoModal)

  function triggerYouTubeModal(evt) {
    evt.preventDefault()

    if (window.YT && window.YT.Player) {
      openYouTubeModal(evt)
    } else {
      const unsubscribe = subscribe(EVENTS.youtubeReady, () => {
        openYouTubeModal(evt)
        unsubscribe()
      })
    }
  }

  function openYouTubeModal(evt) {
    emptyVideoHolder()

    modal.open(evt)

    let videoId = getYoutubeVideoId(evt.currentTarget.getAttribute('href'))
    youtubePlayer = new YouTube(videoHolderId, {
      videoId: videoId,
      style: 'sound',
      events: {
        onReady: onYoutubeReady
      }
    })
  }

  function triggerVimeoModal(evt) {
    evt.preventDefault()

    if (window.Vimeo) {
      openVimeoModal(evt)
    } else {
      const unsubscribe = subscribe(EVENTS.vimeoReady, () => {
        openVimeoModal(evt)
        unsubscribe()
      })
    }
  }

  function openVimeoModal(evt) {
    emptyVideoHolder()

    modal.open(evt)

    let videoId = evt.currentTarget.dataset.videoId
    let videoLoop = evt.currentTarget.dataset.videoLoop
    vimeoPlayer = new VimeoPlayer(videoHolderId, videoId, {
      style: 'sound',
      loop: videoLoop
    })
  }

  function triggerMp4Modal(evt) {
    emptyVideoHolder()

    let el = evt.currentTarget
    let player = el.parentNode.querySelector(selectors.mp4Player)

    // Clone video element and place it in the modal
    let playerClone = player.cloneNode(true)
    playerClone.classList.remove('hide')

    videoHolderDiv.append(playerClone)
    modal.open(evt)

    // Play new video element
    videoHolderDiv.querySelector('video').play()
  }

  function onYoutubeReady(evt) {
    evt.target.unMute()
    evt.target.playVideo()
  }

  function getYoutubeVideoId(url) {
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
    let match = url.match(regExp)
    return match && match[7].length == 11 ? match[7] : false
  }

  function emptyVideoHolder() {
    videoHolderDiv.innerHTML = ''
  }

  function closeVideoModal() {
    if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
      youtubePlayer.destroy()
    } else if (vimeoPlayer && typeof vimeoPlayer.destroy === 'function') {
      vimeoPlayer.destroy()
    } else {
      emptyVideoHolder()
    }
  }
}
