import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async register(): Promise<void> {
    this.errorMessage = null;
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    try {
      await this.authService.register({ email: this.email, password: this.password });
      // Redirect to login page with a success message
      this.router.navigate(['/login'], { queryParams: { registered: 'success' } });
    } catch (error: any) {
      this.errorMessage = error.message || 'Error en el registro. El email ya puede estar en uso.';
      console.error('Registration failed:', error);
    }
  }
}
