export enum svCONCEPT{
  CANVAS,
  RENEGOTIATION
}

export enum RTC_STAGE
{
  START, // receive or send notice about start communication
  TRY_GET_STREAM,
  CREATE_CONNECTION,
  NEGOTIATION,
  CANDIDATES,
  FINISH_CANDIDATES, // end of local candidates
  STARTED,
  CLOSED = -1// rtc connection closed
}

export enum CallEndReason
{
  CALL_CONTINUES, // Połączenie trwa
  CALL_REJECTED, //	Połączenie odrzucone przez odbierającego
  UNANSWERED_CALL, //	Minął czas nawiązywania połączenia
  WS_LOST, // Rozmówca utracił połączenie z WS
  NORMAL_END, // Rozmowa zakończona normalnie
  WebRTC_FAILED, //	Błąd połączenia WebRTC
}

export enum WSoutTypes
{
  INIT_CALL          = 10001,
  LOCAL_DESRIPTION   = 10002,
  CONFIRM_WRTC       = 10003,
  REJECT_CALL        = 10004,
  ACCEPT_CALL        = 10005,
  SEND_ICE_CANDIDATE = 10006,
  CL_RENEGOTIATION   = 10007, // Rządanie rozpoczęcia renegocjacji
  CL_RENEGOTIATION_ANSWER = 10008, // Odpowiedź na renegocjację
  CL_RENEGOTIATION_REQUEST = 10009, // Rządanie renegocjacji przez odbierającego połączenie
  // END_CALL        = 10102, // DEPRECETED!  END CALL BY Local PC
  REQUEST_VIDEO      = 10103,
  REJECT_VIDEO       = 10104,
  END_CALL           = 10105, // add reaseons: 1 - Normal end (by user), 2 - connection error,
  PING               = 10200
}

export enum WSincomingTypes
{
  CONFIRMATION       = 1, // ACK confirmation from server that it got incoming message
  ERROR              = 2,
  FORCE_DISCONNECT   = 3, // Wymuszenie rozłączenia. Struktura jak w TYPE_ERROR
  SERVER_TIME        = 4, // Wiadomość do synchronizacji czasu
  CALL_STATUS        = 101,
  INCOMING_CALL      = 102, // CALL_NEW
  MAKE_P2P           = 103, // Przesłanie sesji obu stron i początek nawiązywania połączenia P2P
  SIDES_READY        = 104, // open call-process component
  REJECTED_CALL      = 105,
  START_CALL         = 106,
  NEW_ICE_CANDIDATE  = 107,
  CALLER_DESCRIPTION = 108, // SESSION EXCHANGE
  PAYMENT_NEEDED     = 109, // payable call
  PIN_ATTEMPTS       = 110, // Blokada z powodu błędnego pinu
  CALL_RENEGOTIATION = 111, // Początek renegocjacji, SDP offer w polu renegotiation_offer
  CALL_RENEGOTIATION_ANSWER = 112, // Odpowiedź renegocjacji, SDP answer w polu renegotiation_answer
  CALL_RENEGOTIATION_REQUEST = 113, // Rządanie renegocjacji od odbierającego połączenie
  END_CALL           = 201, // !!! END
  CURRENT_CALL_INFO  = 202,
  SOME_CHANGE        = 203, // TYPE_CALL_CHANGE - Informacja o zmianach wywołanych przez 2 stronę połączenia (structure jak przy 202)
  CALL_PAUSE_CHANGE  = 204, // Informacja o zawieszeniu/odwieszeniu połączenia (structure jak przy 202)
  CHAT_MESSAGE       = 301,
  CHAT_IS_READ       = 302
}
