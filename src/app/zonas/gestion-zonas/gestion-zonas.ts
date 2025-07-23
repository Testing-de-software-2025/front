import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-zonas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gestion-zonas.html',
  styleUrls: ['./gestion-zonas.css']
})
export class GestionZonasComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
