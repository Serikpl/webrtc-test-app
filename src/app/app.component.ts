import { OnInit, Component, OnDestroy, ElementRef, ViewChild, AfterViewInit } from "@angular/core";
import { Subscription } from "rxjs";
import { PopupComponent } from "./popup/popup.component";
import { UserModel, WScallInfo, BrowserModel, ICE_SERVER, InitCallModel, IceCandidateModel, SocketBaseModel, CallStatusModel } from "./models";
import { WebSocketService } from "./websocket.service";
import { svCONCEPT, RTC_STAGE, WSoutTypes, WSincomingTypes } from "./enums";

const usersT = [
  {
    name: 'User 1',
    number: '',
    id: 'bac1ad4a-d36b-11e8-81a9-1ae4281b0ff8'
  },
  {
    name: 'User 2',
    number: '',
    id: '6e006c87-d36b-11e8-81a9-1ae4281b0ff8'
  }
]


@Component({
  selector: 'app-root',
  templateUrl:  `./app.component.html`,
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy
{
  // DEBUG CONFIG VARS
  readonly SWITCH_ON:boolean = true;
  readonly SHOW_BASE_LOGS:boolean = true;
  readonly SHOW_MESSAGES:boolean = true; // ws messages

  // type of switch stream conception
  readonly SWITCH_VIDEO_CONCEPT:number = svCONCEPT.RENEGOTIATION; // 1 - canvas and replaceTrack(), 2 - renegotiation

  // user to call array
  usersForTests:any[] = usersT;

  // DOM elements
  @ViewChild('videoConfirmPopup') videoConfirmPopup: PopupComponent;
  @ViewChild('callConfirmPopup') callConfirmPopup: PopupComponent;
  @ViewChild('chooseUserPopup') chooseUserPopup: PopupComponent;

  // videos
  @ViewChild('localVideo') localVideo:ElementRef;
  @ViewChild('remoteVideo') remoteVideo:ElementRef;
  @ViewChild('fakeVideo') fakeVideo:ElementRef;

  // main variables
  currentUser:any = null;
  ConfigRTC: RTCConfiguration;
  callState:RTC_STAGE;
  userToCallId:string;
  userToCallModel:UserModel;
  streamConstraints:MediaStreamConstraints;
  localStream:MediaStream;
  remoteStream:MediaStream;
  localPeer:any; // RTCPeerConnection
  remoteCandidates: IceCandidateModel[];
  remoteDescription: RTCSessionDescription;
  offerConstraints: any; // RTCOfferOptions
  usedTracks:MediaStreamTrack[] = []; // initiates after stop all tracks in this array
  fakeStream:MediaStream; // fake stream for replaceTrack and dummy track (from canvas) conception

  // flags
  IisInitiator:boolean;
  callConfirmedWS:boolean;
  sessionSent:boolean;
  callMuted:boolean;
  withVideo:boolean;
  incomingCallNow:boolean;
  videoTrackAdded:boolean;
  iInitiateVideo:boolean;
  isNegotiationState:boolean;

  // helper variables
  renegotiationWas:number;

  // subscriptions
  subsToImcomeWSmes:Subscription;

  constructor(
    public webSocket:WebSocketService
  )
  {}

  ngOnInit()
  {
    console.log('v2 TEST WEBRTC COMPONENT, switched on: ', this.SWITCH_ON, ' show logs:  ', this.SHOW_BASE_LOGS);
    if(this.SWITCH_ON) {
      this.subscribeToIncomeWsMe();
    }
    this.userToCallId = null;
    this.initVars();
  }

  ngAfterViewInit()
  {
    this.localVideo.nativeElement.volume = 0;
    setTimeout(() => this.chooseUserPopup.show(), 200);

  }

  ngOnDestroy()
  {
    if(this.subsToImcomeWSmes) {
      this.subsToImcomeWSmes.unsubscribe();
      this.subsToImcomeWSmes = null;
    }
  }

  userChosen()
  {
    console.log('was chosen user number: ', this.currentUser);
    this.chooseUserPopup.close();
    this.webSocket.openWS(parseInt(this.currentUser));
  }

  // MAIN ///////////////////////////////////////////////////////////////////////
  // + hepler functions
  initVars()
  {
    this.ConfigRTC = { iceTransportPolicy: 'all', bundlePolicy: 'max-bundle',  iceServers: null };
    this.callState = RTC_STAGE.CLOSED;
    // this.userToCallId = null; doesn't need to be here
    this.userToCallModel = null;
    this.streamConstraints = {audio:true, video: false};
    this.localStream = null;
    this.remoteStream = null;
    this.localPeer = null;
    this.remoteCandidates = [];
    this.remoteDescription = null;
    this.offerConstraints = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 0
    };
    this.usedTracks = [];
    this.fakeStream = null;

    // flags
    this.IisInitiator = null;
    this.callConfirmedWS = false;
    this.sessionSent = false;
    this.callMuted = false;
    this.withVideo = false;
    this.incomingCallNow = false;
    this.videoTrackAdded = false;
    this.iInitiateVideo = false;
    this.isNegotiationState = false;

    // hepler vars
    this.renegotiationWas = 0;
  }

  log(...arg)
  {
    if(this.SHOW_BASE_LOGS) {
      const now = (window.performance.now() / 1000).toFixed(3);
      console.log(`${now}: `, ...arg);
    }
  }

  warn(...arg)
  {
    if(this.SHOW_BASE_LOGS) {
      const now = (window.performance.now() / 1000).toFixed(3);
      console.warn(`${now}: `, ...arg);
    }
  }

  error(...arg)
  {
    const now = (window.performance.now() / 1000).toFixed(3);
    console.error(`${now}: `, ...arg);
  }

  selectUserId(id:string)
  {
    this.userToCallId = id;
  }

  getBrowserData(): BrowserModel {
    let result: BrowserModel,
      result_str: string,
      ua = navigator.userAgent, tem,
      M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return this.prepareResult('IE ' + (tem[1] || ''));
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
      if (tem != null)
        return this.prepareResult(tem.slice(1).join(' ').replace('OPR', 'Opera'));
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return this.prepareResult(M.join(' '));
  }

  prepareResult(result_str: string) {
    let result: BrowserModel = new BrowserModel(result_str.split(' ')[0], parseInt(result_str.split(' ')[1]));
    // console.log(result, result.name, parseInt(result.version));
    return result;
  }

  copyToClipboard(e:any)
  {
    let el:any = e.target;
    el.select();
    document.execCommand("copy");
    e.target.value = `${e.target.value} - Copied!`;
  }

  tranformICEservers(s_array: any[]): RTCIceServer[] {
    let new_arr: RTCIceServer[] = [];
    if (s_array.length) {
      new_arr = s_array.map((server: { password: string, tls: boolean, uri: string, username: string }) => {
        return new ICE_SERVER(server.password, server.uri, server.username);
      });
    }
    return new_arr;
  }

  checkIfCallCanStart()
  {
    if(!this.userToCallId) {
      // this.snack.show('User id empty', SnackStates.ERROR);
      console.error('User id empty');
      return false;
    }
    return true;
  }

  sendLocalDescription(desc: RTCSessionDescription, type?:RTCSdpType) {
    let descr_str = { description: desc.sdp };
    this.webSocket.sendMessage(WSoutTypes.LOCAL_DESRIPTION, descr_str, 'Send description/session', null, true);
  }

  transformAddRemoteCandidates(candidate?: IceCandidateModel) {
    // console.log('Transform and add remote candidates');
    if (this.localPeer) {
      if (this.remoteCandidates.length) {
        this.remoteCandidates.map(candidate => {
          let formated_candidate: RTCIceCandidate = this.transformCandidate(candidate);
          this.addOneCandidateToPeer(formated_candidate);
        })
        this.remoteCandidates = [];
      }
      else {
        let formated_candidate: RTCIceCandidate = this.transformCandidate(candidate);
        this.addOneCandidateToPeer(formated_candidate);
      }
    }
    else if (candidate) {
      this.remoteCandidates.push(candidate);
    }
  }

  transformCandidate(candidate: IceCandidateModel): RTCIceCandidate {
    let formated_candidate = new RTCIceCandidate({
      candidate: candidate.sdp,
      sdpMLineIndex: candidate.sdp_m_line_index,
      sdpMid: candidate.sdp_mid
    });
    return formated_candidate;
  }

  handleRemoteDescription(mes: SocketBaseModel) {
    this.log('Handle remote description ()');
    if (this.IisInitiator) {
      this.recieveRemoteDescription(mes.data.receiver_session, true);
    } else {
      this.recieveRemoteDescription(mes.data.caller_session, false);
    }
  }

  recieveRemoteDescription(description: RTCSessionDescription, isAnswer?: boolean) {
    if(!this.IisInitiator) this.isNegotiationState = true;
    if (description) {
      this.log('!. set REMOTE description, it is answer: ', isAnswer, 'it is offer: ', !isAnswer);
      this.remoteDescription = description;
      if (this.localPeer) {
        this.setRemoteDescriptionForLocalPC(this.remoteDescription, isAnswer);
      }
    }
    else if (!isAnswer && this.remoteDescription) {
      this.setRemoteDescriptionForLocalPC(this.remoteDescription, isAnswer);
    }
  }

  setRemoteStreamToVideoTag(stream?:MediaStream)
  {
    this.remoteVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = stream;
  }

  setLocalStreamToVideoTag(stream?:MediaStream)
  {
    this.localVideo.nativeElement.srcObject = null;
    this.localVideo.nativeElement.srcObject = stream;
  }

  pushToUsedTracksArr(new_track:MediaStreamTrack)
  {
    console.log('PUSH new track to used tracks arr');
    this.usedTracks.push(new_track);
    console.log('Used tracks: ', this.usedTracks);
  }

  getFakeStream(get_stream:boolean = false):any
  {
    this.fakeVideo.nativeElement.getContext('2d').fillRect(0, 0, 0, 0);
    let c_stream = this.fakeVideo.nativeElement.captureStream();
    let fake_t:MediaStreamTrack = Object.assign(c_stream.getVideoTracks()[0], {enabled: true});
    // let silence:MediaStreamTrack = this.getSilenceTrack();

    // silence.onended = (e) => console.log('silence ended')

    if(!this.fakeStream) {
      this.fakeStream = new MediaStream([fake_t]);
      // stream.stop();
    }
    this.pushToUsedTracksArr(fake_t);

    return (get_stream) ? this.fakeStream : fake_t;
  }

  getSilenceTrack()
  {
    let ctx:any = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst:any = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    return Object.assign(dst.stream.getAudioTracks()[0], {enabled: true});
  }

  changeStreamConstraints(withVideo:boolean)
  {
    this.withVideo = withVideo;
    this.streamConstraints.video = withVideo;
    this.offerConstraints.offerToReceiveVideo = (withVideo) ? 1 : 0;
  }
  // - end helper functions

  // + DOM event handlers
  initCall(withVideo:boolean = false)
  {
    console.warn('>>>>>>>>>> Init call')
    if(this.checkIfCallCanStart() && this.SWITCH_ON)
    {
      this.IisInitiator = true;
      this.withVideo = withVideo;
      let init_call: InitCallModel = new InitCallModel(this.userToCallId, withVideo);
      this.webSocket.sendMessage(WSoutTypes.INIT_CALL, init_call, 'Init call', null, true);
    }
    else {
      console.log('this.checkIfCallCanStart() && this.SWITCH_ON : ', this.checkIfCallCanStart(), this.SWITCH_ON);
    }

  }

  acceptCall()
  {
    this.log('accept call()');
    this.webSocket.sendMessage(WSoutTypes.ACCEPT_CALL, false, 'Accept call', null, true);
    this.callConfirmPopup.close();
    this.incomingCallNow = false;
    this.muteLocalAudioTrack(true);
  }

  rejectCall()
  {
    this.log('reject call()');
    this.webSocket.sendMessage(WSoutTypes.REJECT_CALL);
    this.callConfirmPopup.close();
    this.incomingCallNow = false;
  }

  muteLocalAudioTrack(muteAudio:boolean)
  {
    this.log('Mute local audio: ', muteAudio);
    this.callMuted = muteAudio;
    if(this.localStream) {
      this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !muteAudio;
      });
    }
  }

  enableLocalVideo(enable:boolean)
  {
    this.log('Enable video: ', enable);

    console.log('Senders befor delete: ', this.localPeer.getSenders());
    if(this.localStream)
    {
      this.localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        console.log('track ', track);
        if(!enable) {
          track.enabled = enable;
          track.stop();
          this.removeVideoSenderTrack();
          this.localStream.removeTrack(track);
          track = null;
        }
      });

      // here is diff between firefox and chrome
      console.log('Senders after delete: ', this.localPeer.getSenders());
    }
  }

  removeVideoSenderTrack()
  {
    // this.log('removeVideoTrack, browser: ', this.getBrowserData());
      this.localPeer.getSenders().forEach((s:RTCRtpSender) =>
      {
        if(s && s.track) {
          (s.track.kind === 'video') ? this.localPeer.removeTrack(s) : null;
        }
      });
      // this.sessionSent = false; // helper flag
  }

  switchVideo()
  {
    this.warn('switchVideo() - click, show video = ', !this.withVideo);
    let switched_video = !this.withVideo;
    if(switched_video === false)
    {
      this.enableLocalVideo(false);

      this.changeStreamConstraints(false);
      this.webSocket.sendMessage(WSoutTypes.REJECT_VIDEO, false, 'Reject video', null, true);
    }
    else if(switched_video === true)
    {
      this.getStream(true,true);
    }
  }

  acceptVideo()
  {
    this.warn('accept video() - by user');
    if(this.callState === RTC_STAGE.STARTED) {
      this.getStream(true, false);
      this.videoConfirmPopup.close();
    }
  }

  refuseVideo()
  {
    this.log('refuse video() - by user');
    this.webSocket.sendMessage(WSoutTypes.REJECT_VIDEO, false, 'Reject video');
    this.videoConfirmPopup.close();
    // this.enableVideo(false);
  }

  endCall()
  {
    this.webSocket.sendMessage(WSoutTypes.END_CALL, false, 'END CALL sended', null, false);

    this.hangUpHandler();
  }
  // - end DOM event handlers

  // + STREAM HANDLERS
  // + STREAM HANDLERS %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  // + STREAM HANDLERS
  getStream(withVideo:boolean = false, iInitSwitchingV?:boolean)
  {
    this.log('1. Try get stream, with video: ', withVideo, ' call state: ', this.withVideo);

    // test
    // withVideo = true;
    this.changeStreamConstraints(withVideo);

    if(iInitSwitchingV) this.iInitiateVideo = true;

    navigator.mediaDevices.getUserMedia(this.streamConstraints)
    .then(stream => {
      this.streamGotten(stream, iInitSwitchingV);
    })
    .catch(err => this.error(err))
  }

  streamGotten(stream: MediaStream, sendVReques?:boolean)
  {
    this.log('Stream GOTTEN: ', stream.getTracks()); // got stream

    if(this.callState !== RTC_STAGE.STARTED)
    {
      this.setLocalStreamToVideoTag(stream);
      stream.getTracks().forEach(t => { this.pushToUsedTracksArr(t); });
      this.localStream = stream;
      this.muteLocalAudioTrack(true);
      this.createRTCconnection();
    }
    else {
      this.switchVideoTrack(stream);
    }
  }

  switchVideoTrack(stream?:MediaStream)
  {
    switch(this.SWITCH_VIDEO_CONCEPT)
    {
      case svCONCEPT.RENEGOTIATION:
      this.addVideoToLocalStream(stream);
      break;

      case svCONCEPT.CANVAS:
      this.replaceVideoTrack(stream);
      break;

      default:
      break;
    }
  }

  addVideoToLocalStream(stream?:MediaStream)
  {
    this.log('Add video track to local stream()');
    // console.log('local stream tracks: ', this.localStream.getTracks().length, this.localStream.getTracks());
    // console.log('local peer senders: ', this.localPeer.getSenders().length, this.localPeer.getSenders());

    let newVideoTracks = stream.getVideoTracks();
    let newAudioTracks = stream.getAudioTracks();


    this.localStream.addTrack(newVideoTracks[0]); // add track to stream

    this.setLocalStreamToVideoTag(stream);

    this.localPeer.addTrack(newVideoTracks[0], this.localStream); // add track to rtc peer connection

    // console.log('after add local stream tracks: ', this.localStream.getTracks().length, this.localStream.getTracks());
    // console.log('after add local peer senders: ', this.localPeer.getSenders().length, this.localPeer.getSenders());

    // this.sessionSent = false; // helper flag

    this.webSocket.sendMessage(WSoutTypes.REQUEST_VIDEO, false, 'Send request about video', null, true);

    // CLEAR NEW AUDIO tracks, because NOT NEEDED
    newAudioTracks.forEach(t => t.stop());

    newVideoTracks.forEach(t => this.pushToUsedTracksArr(t));
  }

  replaceVideoTrack(stream:MediaStream)
  {
    this.log('replaceLocalStream() stream: ', (stream) ? true : false);
    // console.log('with video ', this.withVideo);
    let local_tracks = this.localStream.getTracks();
    let new_video = stream.getTracks().find(t => t.kind === 'video');

    if(this.withVideo) {
      if(stream) {
        this.localPeer.getSenders().forEach((rtp_sender:any) => {
          if(rtp_sender.track.kind === 'video') {
            // console.log('sender: ', -rtp_sender);
            rtp_sender.replaceTrack( new_video )
            .then(e => replacedTrackHandler())
            .catch(e => this.error(e));
          }
        })
      }
    }

    this.setLocalStreamToVideoTag();
    this.webSocket.sendMessage(WSoutTypes.REQUEST_VIDEO, false, 'Send request about video', null, true);

    let replacedTrackHandler = () =>
    {
      if(this.callMuted) {
        this.muteLocalAudioTrack(true);
      }
    }
  }

  addLocalStream()
  {
    switch(this.SWITCH_VIDEO_CONCEPT)
    {
      case svCONCEPT.RENEGOTIATION:
      this.addLocalStreamRenegotiation();
      break;

      case svCONCEPT.CANVAS:
      this.addLocalStreamCanvas();
      break;

      default:
      break;
    }
  }

  addLocalStreamRenegotiation()
  {
    this.log('3. Add Stream')
    try{
      // this.localPeer.addStream(this.localStream); // depraceted
      this.localStream.getTracks().forEach((track:MediaStreamTrack, i) => {
        this.localPeer.addTrack(track, this.localStream);
      });
    }
    catch(e) {
      this.error(e);
    }
  }

  addLocalStreamCanvas()
  {
    this.log('Add local stream canvas() ');
    let fakeStream = this.getFakeStream(true);
    let not_fake_tracks = this.localStream.getTracks();
    let not_fake_audio = this.localStream.getAudioTracks()[0];

    if(not_fake_tracks.length === 1) {
      fakeStream.getTracks().forEach((track:MediaStreamTrack, i) => {
        console.log('fake track: ', track, track.readyState);
        if(track.kind === 'video') this.localStream.addTrack(track);

        this.localPeer.addTrack(track, fakeStream);
      });
    }
    this.localPeer.addTrack(not_fake_audio, this.localStream);
    console.log('Fake track added to local stream! ', this.localStream.getTracks(), this.localPeer.getSenders())
  }

  handleRemoteStreamAdded(e) {
    this.log('OnTrack');
    if (e && e.streams && e.streams.length)
    {
      let stream:MediaStream = e.streams[0];

      console.log('remote stream tracks: ', stream.getTracks()[0], stream.getTracks()[1]);

      this.setRemoteStreamToVideoTag(stream);
    }
  }
  // - end STREAM HANDLERS


  // + RTC handlers functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> RTC
  // + RTC handlers functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> RTC
  // + RTC handlers functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> RTC
  createRTCconnection()
  {
    this.log('2.Create RTC connection')
    try{
      this.localPeer = new RTCPeerConnection(this.ConfigRTC);
      this.addLocalStream();
      this.addListenersForRTC();
    }
    catch(e) {
      this.error(e);
    }
  }

  addListenersForRTC() {
    this.log('4. Set listeners ');
    // callback for ICE candidate
    this.localPeer.onnegotiationneeded = (peer: RTCPeerConnection, ev: Event) => this.onNegotiationNeededHandler();

    this.localPeer.onicecandidate = (e) => this.oneIceCandidate(e);

    this.localPeer.ontrack = (e) => this.handleRemoteStreamAdded(e);

    this.localPeer.oniceconnectionstatechange = (e) =>  this.onIceConnectionStateChangeHandler(e);

    if (!this.IisInitiator && this.remoteDescription) {
      this.recieveRemoteDescription(this.remoteDescription, false);
    }

  }

  onNegotiationNeededHandler()
  {
    this.log('@@@ on negotioation needed');
    if((this.IisInitiator || this.callState === RTC_STAGE.STARTED) && !this.isNegotiationState) {
    //   this.sessionSent = true;
      if(this.IisInitiator) {
        this.createOffer();
      }  else {
        this.isNegotiationState = true;
        this.webSocket.sendMessage(WSoutTypes.CL_RENEGOTIATION_REQUEST, null, 'send renegotioation request', null, true);
      }
    }
  }

  onIceConnectionStateChangeHandler(e:any)
  {
    this.log('@@@ on ice connection state change(), ice connection state: ', e.currentTarget.iceConnectionState);
    if (e.currentTarget.iceConnectionState === 'connected' && !this.callConfirmedWS) {
      this.callConfirmedWS = true;
      this.webSocket.sendMessage(WSoutTypes.CONFIRM_WRTC, false, 'Confirm WebRTC ', null, false);
    }
    else if (e.currentTarget.iceConnectionState === 'failed') {
      this.webSocket.sendMessage(WSoutTypes.END_CALL, { reason: 2 }, 'Connection failed!');
      this.hangUpHandler();
    }
  }

  createOffer()
  {
    if(!this.isNegotiationState && this.callState !== RTC_STAGE.CLOSED)
    {
      this.isNegotiationState = true;
      this.log('5. Create offer, constraints: ', this.offerConstraints);
      this.renegotiationWas++;

      this.localPeer.createOffer(this.offerConstraints)
      .then((desc: RTCSessionDescription) => this.setLocalDescriptionForLocalPC(desc.sdp, 'offer'))
      .catch(err => this.error('create offer failed: ', err))
    }
  }

  createAnswer()
  {
    this.log('5. Create answer');

    this.localPeer.createAnswer(this.offerConstraints)
    .then((desc: RTCSessionDescription) => {
      this.setLocalDescriptionForLocalPC(desc.sdp, 'answer');
    })
    .catch(err => this.error('create answer failed: ', err))
  }

  // Local desc | LOCAL PC: 1
  setLocalDescriptionForLocalPC(desc:any, type:RTCSdpType)
  {
    let description = new RTCSessionDescription({ sdp: desc, type: type });

    this.localPeer.setLocalDescription(description)
    .then(() => {
      this.log(" LOCAL description Added")
      this.sendLocalDescription(description, type);
      if(type === 'answer' && !this.IisInitiator) {
        this.isNegotiationState = false;
      }
      if (this.remoteCandidates.length && this.localPeer.remoteDescription) {
        this.transformAddRemoteCandidates();
      }
    })
    .catch(err => this.error('fail to set LOCAL description for LOCAL_PC: ', err))
  }

  // Remote Descr | Local PC: 2
  setRemoteDescriptionForLocalPC(desc, isAnswer) {

    let description = new RTCSessionDescription({ sdp: desc, type: (isAnswer) ? 'answer' : 'offer' });

    this.localPeer.setRemoteDescription(description)
    .then(() => {
      this.log(" REMOTE description added")

      if (!isAnswer) {
        this.createAnswer();
      }
      else {
        this.isNegotiationState = false;
      }
      // console.log('LOCAL peer: ', this.local_pc);
      if (this.remoteCandidates.length && this.localPeer.localDescription) {
        this.transformAddRemoteCandidates();
      }
    })
    .catch(err => this.error('fail to set REMOTE description LOCAL_PC: ', err, ' descriptio: ', desc))
  }

  oneIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      let new_candidate = new IceCandidateModel();
      new_candidate.sdp = event.candidate.candidate;
      new_candidate.sdp_m_line_index = event.candidate.sdpMLineIndex;
      new_candidate.sdp_mid = event.candidate.sdpMid;
      new_candidate.server_url = '';

      // new_candidate.sdp = this.transformFFCandidate(new_candidate.sdp); // test for fix error with ICE fieled

      this.webSocket.sendMessage(WSoutTypes.SEND_ICE_CANDIDATE, new_candidate, "Send Local CANDIDATE!", null, false);
    }
    else {
      if(this.callState !== RTC_STAGE.STARTED) this.callState = RTC_STAGE.FINISH_CANDIDATES;
      this.log('&&&&&&&&&&& End LOCAL candidates!');
    }
  }

  addOneCandidateToPeer(candidate: RTCIceCandidate)
  {
    this.localPeer.addIceCandidate(candidate)
    .then(() => {      // console.log('Remote candidate added');
    })
    .catch((err) => console.error('Add candidate failed: ', err))
  }

  // -  end RTC handlers functions

  // + WS message HANDLERS
  // INCOMING CALL <<<<<<<<<<<<<<<<<<<<<<<
  incomingCallHandler(data:any)
  {
    console.warn('<<<<<<<<<<<<<<< Incoming call');
    this.ConfigRTC.iceServers = this.tranformICEservers(data.ice_servers);

    this.getStream();
    this.incomingCallNow = true;
    this.userToCallModel = data.caller_model;
  }

  callStatusHandler(mes: SocketBaseModel)
  {
    if (mes.data && mes.data.ice_servers) {
      this.ConfigRTC.iceServers = this.tranformICEservers(mes.data.ice_servers);
      // (this.isInitiator) ? this.startRTCconnection() : this.tryGetStream();
      this.userToCallModel = mes.data.receiver_model;
      this.callState = RTC_STAGE.START;
      this.getStream();
    }
  }

  startCallHandler(data:CallStatusModel)
  {
    this.callState = RTC_STAGE.STARTED;
    this.muteLocalAudioTrack(false);
    this.someChangeHandler(data, true);
  }

  sidersReadyHandler()
  {
    if(this.incomingCallNow) {
      this.callConfirmPopup.show();
    }
  }

  handleRemoteCandidate(mes: SocketBaseModel) {
    if (this.IisInitiator) {
      this.transformAddRemoteCandidates(mes.data.receiver_ice_candidates[mes.data.receiver_ice_candidates.length - 1]);
    }
    else {
      this.transformAddRemoteCandidates(mes.data.caller_ice_candidates[mes.data.caller_ice_candidates.length - 1]);
    }
  }

  someChangeHandler(data:WScallInfo | CallStatusModel, start_call?:boolean)
  {
    if(!start_call) this.warn('Request Video changes - receiver_vide: ',data.receiver_video, ' caller_video: ', data.caller_video, ' data.video: ', data.video, ' is initiator: ', this.IisInitiator );
    if(this.IisInitiator) {
      if(data.receiver_video && !data.video) { // request for switch to video chat
        this.videoConfirmPopup.show();
        this.log('request for switch video - popup showed()');
      }
      else if(data.caller_video === data.video) { // confirmation of switch on/off video
        this.confirmSomeChanges(data.video);
      }
      else if(data.caller_video && !data.video && start_call) { // start of call when 10006 incoming, not confiramtion
        this.getStream(data.caller_video, true);
      }
    }
    else if(!this.IisInitiator) {
      if(data.caller_video && !data.video) { // request for switch to video chat
        this.videoConfirmPopup.show();
        this.log('request for switch video - popup showed()');
      }
      else if(data.receiver_video === data.video) { // confirmation of switch on/off video
        this.confirmSomeChanges(data.video);
      }
    }
  }

  confirmSomeChanges(withVideo:boolean)
  {
    this.log('confirmation of switch on/off video - ', withVideo);
    this.enableLocalVideo(withVideo);

    this.withVideo = withVideo;
  }

  renegotiationRequestHandler()
  {
    if(this.IisInitiator) {
      this.log('renegotiation request from calle () ');
      this.createOffer();
    }
  }

  hangUpHandler()
  {
    this.log('hangUp');
    this.stopTracks();
    this.clearVideosSrc();
    this.initVars();
    if(this.localPeer) this.localPeer.close();
  }

  clearVideosSrc()
  {
    if (this.localVideo) {
      this.localVideo.nativeElement.srcObject = null;
    }
    if (this.remoteVideo) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
  }

  stopTracks()
  {
    this.log('stopTracks(), used tracks: ', this.usedTracks);
    this.usedTracks.forEach((track:any ) => {
      track.stop();
    });

    if(this.localStream)
    {
      console.log('stop local str tracks ', this.localStream.getTracks().length);
      this.localStream.getTracks().forEach((one_s: MediaStreamTrack) => {
        one_s.stop();
        // one_s = null;
      });
    }

    if(this.remoteStream)
    {
      console.log('stop remote str tracks  ', this.remoteStream.getTracks().length);
      this.remoteStream.getTracks().forEach((one_s: MediaStreamTrack) => {
        one_s.stop();
        // one_s = null;
      });
    }
  }
  // - end WS message HANDLERS

  // WS messages SUBSCRIPTION
  // WS SUBSCRIPTION ++++++++++++++++++++++++++++++++++++++++++++++++++++
  // WS SUBSCRIPTION
  subscribeToIncomeWsMe() {
    this.subsToImcomeWSmes = this.webSocket.WS_incom_message.subscribe(
      (mes: SocketBaseModel) => {
        if(mes) {

          if(mes.type !== WSincomingTypes.CONFIRMATION &&
            mes.type !== WSincomingTypes.CURRENT_CALL_INFO &&
            mes.type !== WSincomingTypes.NEW_ICE_CANDIDATE
          )
          {
            (this.SHOW_MESSAGES) ? console.log("WS incoming message - type: ", mes.type, " data: ", mes) : null;
          }

          this.wsDispatcher(mes);
        }
        else {
          console.log('WS mes: ', mes);
        }
      },
      (err: any) => console.log(err)
    )
  }

  wsDispatcher(mes: SocketBaseModel)
  {
    switch (mes.type) {

      case WSincomingTypes.CALL_STATUS:  // call status incoming, that means stream can be got
      this.callStatusHandler(mes);
      break;

      case WSincomingTypes.INCOMING_CALL:
      this.incomingCallHandler(mes.data);
      break;

      case WSincomingTypes.START_CALL:
      this.startCallHandler(mes.data);
      break;

      case WSincomingTypes.SIDES_READY:
      this.sidersReadyHandler();
      break;

      case WSincomingTypes.CALLER_DESCRIPTION:
      this.handleRemoteDescription(mes);
      break;

      case WSincomingTypes.MAKE_P2P:
      this.handleRemoteDescription(mes);
      break;

      case WSincomingTypes.NEW_ICE_CANDIDATE:
      this.handleRemoteCandidate(mes);
      break;

      case WSincomingTypes.SOME_CHANGE:
      this.someChangeHandler(mes.data);
      break;

      case WSincomingTypes.CALL_RENEGOTIATION:
      this.recieveRemoteDescription(mes.data.renegotiation_offer, false);
      break;

      case WSincomingTypes.CALL_RENEGOTIATION_ANSWER:
      this.recieveRemoteDescription(mes.data.renegotiation_answer, true);
      break;

      case WSincomingTypes.CALL_RENEGOTIATION_REQUEST:
      this.renegotiationRequestHandler();
      break;

      case WSincomingTypes.END_CALL:
      case WSincomingTypes.REJECTED_CALL:
      this.hangUpHandler();
      break;

      default:
      break;
    }
  }
}
