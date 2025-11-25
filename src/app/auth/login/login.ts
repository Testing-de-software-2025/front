import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'success') {
        this.successMessage = '¡Registro exitoso! Ahora puedes iniciar sesión.';
      }
    });
  }

  async login(): Promise<void> {
    this.errorMessage = null;
    this.successMessage = null; // Clear success message on new login attempt
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    try {
      await this.authService.login({ email: this.email, password: this.password });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Email o contraseña incorrectos.';
      console.error('Login failed:', error);
    }
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }
}
