import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommentService } from '../services/comment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-host-comments-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-comments-component.html',
  styleUrl: './host-comments-component.css'
})
export class HostCommentsComponent implements OnInit {
  accommodationId!: number;
  comments: any[] = [];
  replyText: string = '';

  private readonly route = inject(ActivatedRoute);
  private readonly commentService = inject(CommentService);

  ngOnInit() {
    this.accommodationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadComments();
  }

  loadComments() {
    this.commentService.getByAccommodation(this.accommodationId).subscribe(res => {
      this.comments = res.content;
    });
  }

  sendReply(commentId: number) {
    if (!this.replyText.trim()) return;
    this.commentService.reply(commentId, this.replyText).subscribe(() => {
      this.replyText = '';
      this.loadComments();
    });
  }
}