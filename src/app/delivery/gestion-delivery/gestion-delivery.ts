import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gestion-delivery.html',
  styleUrl: './gestion-delivery.css'
})
export class GestionDeliveryComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
