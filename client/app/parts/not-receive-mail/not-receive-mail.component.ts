import { Component } from '@angular/core';
import { notReceiveMail } from 'client/app/common/message-defines';

@Component({
  selector: 'app-not-receive-mail',
  templateUrl: './not-receive-mail.component.html',
  styleUrls: ['./not-receive-mail.component.scss']
})
export class NotReceiveMailComponent {
  // メールが届かない場合の案内文表示
  notReceiveMail = notReceiveMail;
}
