import { WSoutTypes, WSincomingTypes } from "./enums";

export class CallState
{
  constructor(
    public user:UserModel | string = null,
    public state_type:number | null = null,
    public video:boolean = null
  )
  {}
}

export interface IDevice {
  deviceId:string;
  groupId:string;
  kind:string;
  label:string
}

export class ICE_SERVER
{
  constructor(
    public credential: string | null = '',
    public urls: any = '',
    public username: string | null = ''
  )
  {  }
}

export interface WScallInfo
{
  duration: number;
  price: number;
  video: boolean;
  caller_audio: boolean;
  caller_video: boolean;
  receiver_audio: boolean;
  receiver_video: boolean;
}

export class InitCallModel
{
  constructor(
    public receiver_id:string,
    public video:boolean,
    public price:number = null,
    public pin:string = null
  )
  {}
}

export interface WSerror
{
  error_type: number;
  seq:number;
  error_message:string;
}

export class CallRateModel
{
  constructor(
    public comment:string,
    public connection_rate:number,
    public service_rate:number
  )
  {}
}

export class BrowserModel {
  // name: string = null;
  // version: any = null;
  constructor(public name?: string, public version?: any) { }
}



export class UserModel {
  phone_number: string = '';
  provider_data: any;
  created: string = '';
  modified: string = '';
  contacts_count: number = null;
  costs?: any[] = null;
  user_id: string = '';
  show_phone: boolean = null;
  available: boolean = null;
  name: string = '';
  last_name: string = '';
  country: any = null;
  description: string = '';
  profile_photo: string = '';
  big_town: any;
  is_provider: boolean = null;
  is_contact: boolean = null;
  blocked: boolean = null;
  received_rates?: any = null;
  blocked_by_me: boolean = null;
  title?: string = '';
  contact_id?: string = '';
  filtered?: boolean = true;
  categories?: string = '';
  provider_rates_avg: number = 0;
  provider_rates_count: number = 0;
  private_rates_avg: number = 0;
  private_rates_count: number = 0;
  total_seconds: number = 0;
  email?: string = null;
  is_pin_set?: boolean = false;
}

export class SocketBaseModel
{
  type:WSoutTypes | WSincomingTypes = null;
  seq:number = null;
  data?:any = null;
}

export class CallStatusModel {
  call_id: any = null;
  caller_id: string = '';
  caller_session: any = null;
  caller_video:true = null;
  caller_stream_confirmed: boolean = null;
  caller_ice_candidates: IceCandidateModel[] = [];
  video: boolean = null;
  was_video: boolean = null;
  ice_servers: IceServerModel[] = [];
  start_time: number = null;
  state: number = null;
  time: number = null;
  last_state_change: number = null;
  receiver_stream_confirmed: boolean = null;
  receiver_session: any = null;
  receiver_ice_candidates: IceCandidateModel[] = [];
  receiver_id: string = '';
  receiver_video:boolean = null;
  end_reason:number = null;
}

export class IceServerModel {
  uri: string = '';
  tls: boolean = null;
  username: string = '';
  password: string = '';
}

export class IceCandidateModel {
  sdp_mid: string = '';
  sdp_m_line_index: number = null;
  sdp: string = '';
  server_url: string = '';
}
