/*
* -----
* Graphicbox Sp. z o.o.
* Author: Serhii Koliechkin ( s.koliechkin@graphicbox.pl )
* File Created: Wednesday, 27th June 2018 10:59:37 am
* -----
*/


import { Injectable, EventEmitter } from "@angular/core";
import { SocketBaseModel } from "./models";
import { Router } from "../../node_modules/@angular/router";
import { Configuration } from "./configuration";


@Injectable()
export class WebSocketService
{
  token1:string = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwYXlzdGVlci5iYWNrZW5kenMucGwiLCJpYXQiOjE1Mzk5MzU4OTcsInNlcV9ubyI6OTk5OTk5OTksInVzZXJfaWQiOiJiYWMxYWQ0YS1kMzZiLTExZTgtODFhOS0xYWU0MjgxYjBmZjgiLCJpc19hZG1pbiI6ZmFsc2UsInJlZ19zdGF0ZSI6MH0.qb3AIK8LNYcmaep4v1Ldd0MfqbRJ-Gc4b9FXLQmzR9Y';
  token2:string =  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwYXlzdGVlci5iYWNrZW5kenMucGwiLCJpYXQiOjE1Mzk5MzU5MTUsInNlcV9ubyI6OTk5OTk5OTksInVzZXJfaWQiOiI2ZTAwNmM4Ny1kMzZiLTExZTgtODFhOS0xYWU0MjgxYjBmZjgiLCJpc19hZG1pbiI6ZmFsc2UsInJlZ19zdGF0ZSI6MH0.nIlkw5ufPoXJP8xEjCrZi3McwLPDjHllANOX58wb6Go';

  WS_incom_message:EventEmitter<SocketBaseModel | boolean> = new EventEmitter();
  WS_out_message:EventEmitter<SocketBaseModel> = new EventEmitter();

  pingTimeoutEmit:EventEmitter<number> = new EventEmitter();

  ws:WebSocket;
  seq_iteration:number = 1; // increase by every sent (from me) message

  ws_opened:boolean = false;

  first_time_reconnected:boolean = false;

  ping_interval:any;
  ping_timeout:number;
  can_error_recconect:boolean = true;

  constructor()
  {
  }

  openWS(user_n:number)
  {
    let token:string = (user_n === 1) ? this.token1 : this.token2;
    this.ws = new WebSocket(Configuration.WebSocket_URL + '?token=' + token);

    // another token
    // "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwYXlzdGVlci5iYWNrZW5kenMucGwiLCJpYXQiOjE1Mzk5MzU5MTUsInNlcV9ubyI6OTk5OTk5OTksInVzZXJfaWQiOiI2ZTAwNmM4Ny1kMzZiLTExZTgtODFhOS0xYWU0MjgxYjBmZjgiLCJpc19hZG1pbiI6ZmFsc2UsInJlZ19zdGF0ZSI6MH0.nIlkw5ufPoXJP8xEjCrZi3McwLPDjHllANOX58wb6Go"

    this.errorListener();
    this.messageListener();

    this.ws.onopen = () => {
      (Configuration.Debug)? console.log('WS open') : null;
      this.ws_opened = true;
      this.first_time_reconnected = false;
      this.closeListener();
      this.windowListener();
      // this.setPingIntervalHandler();
    }
  }

  messageListener()
  {
    this.ws.onmessage = (event:any) => {
      let data_obj:SocketBaseModel;
      if(event.data)
      {
        data_obj = JSON.parse(event.data);
      }
      // (Configuration.Debug) ? console.log('UPDATED DATA: ', data_obj) : null;
      this.baseWSMessageHandler(data_obj);
    }
  }

  baseWSMessageHandler(data_obj:any)
  {
    this.WS_incom_message.emit(data_obj);
  }

  closeListener()
  {
    this.ws.onclose = (event:any) => {
      (Configuration.Debug) ? console.log("WS CLOSE: ", event) : null;
      this.ws_opened = false;
      this.WS_incom_message.emit(false);
    }
  }

  errorListener()
  {
    this.ws.onerror = (event:any) => {
      (Configuration.Debug) ? console.log(event) : null;
      (Configuration.Debug) ? console.log('WS ERROR', event.message) : null;
    }
  }



  closePingInterval()
  {
    clearInterval(this.ping_interval);
    this.ping_interval = null;
    this.ping_timeout = null;
  }

  windowListener()
  {
    window.onbeforeunload = (e:BeforeUnloadEvent) => {
      this.closeSocket();
    }
  }

  closeSocket()
  {
    this.ws.close();
    this.can_error_recconect = false;
  }

  sendMessage(type:number, data?:any, console_title?:string, callback?:Function, show_log:boolean = false)
  {
    let message:SocketBaseModel = this.createNewRequest(type, data)
    let message_json:string = JSON.stringify(message);
    // debugger;
    if(show_log) console.log("WS message SENT - type: ", message.type, ' data: ', message, " Title: ", console_title);
    this.ws.send(message_json);
    this.WS_out_message.emit(message);
    this.seq_iteration++;
    (callback) ? callback() : null;
  }

  createNewRequest(type?:number, data?:any): SocketBaseModel
  {
    let request:SocketBaseModel = new SocketBaseModel();
    request.seq = this.seq_iteration;
    request.type = type;
    request.data = (data) ? data : {};

    return request;
  }
}
