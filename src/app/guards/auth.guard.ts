import type { CanActivateFn } from "@angular/router"
import { inject } from "@angular/core"
import { Router } from "@angular/router"
import { AuthService } from "../services/auth.service"

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router)
  const authService = inject(AuthService)

  if (!authService.isAuthenticated()) {
    router.navigate(["/login"])
    return false
  }

  // Check and refresh token if needed
  const tokenValid = await authService.checkAndRefreshTokenIfNeeded()

  if (!tokenValid) {
    router.navigate(["/login"])
    return false
  }

  return true
}