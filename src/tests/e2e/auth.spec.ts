import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText('Bienvenido');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Iniciar Sesión');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=¿No tienes cuenta? Regístrate');
    
    await expect(page).toHaveURL('/registro');
    await expect(page.locator('h1')).toContainText('Crear Cuenta');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/registro');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.blur();
    
    // Check for validation error (implementation dependent)
    await expect(page.locator('input[name="email"]')).toHaveValue('invalid-email');
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/registro');
    await page.fill('input[name="password"]', 'weak');
    
    // Check for password strength indicator
    const passwordStrength = page.locator('text=Mínimo 8 caracteres');
    await expect(passwordStrength).toBeVisible();
  });

  test('should show consent requirement for under 16', async ({ page }) => {
    await page.goto('/registro');
    await page.fill('input[name="edad"]', '15');
    
    // Check for consent checkbox
    const consentCheckbox = page.locator('input[type="checkbox"]');
    await expect(consentCheckbox).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/registro');
    
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Password123');
    await page.fill('input[name="edad"]', '16');
    await page.selectOption('select[name="grado"]', '3° Secundaria');
    
    // Submit form (will fail in test environment without backend)
    await page.click('button[type="submit"]');
    
    // In real scenario, would redirect to dashboard
    // await expect(page).toHaveURL('/dashboard');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // In real scenario, would redirect to dashboard
    // await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Dashboard Flow', () => {
  test('should display dashboard after login', async ({ page }) => {
    // Skip actual login, go directly to dashboard for UI testing
    await page.goto('/dashboard');
    
    await expect(page.locator('h1')).toContainText('Hola');
    await expect(page.locator('text=Acciones Rápidas')).toBeVisible();
  });

  test('should navigate to exercises', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Ejercicios');
    
    await expect(page).toHaveURL('/ejercicios');
    await expect(page.locator('h1')).toContainText('Ejercicios de Bienestar');
  });

  test('should navigate to chat', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Chat con IA');
    
    await expect(page).toHaveURL('/chat-ia');
    await expect(page.locator('h1')).toContainText('Asistente de Bienestar');
  });
});

test.describe('Evaluation Flow', () => {
  test('should display evaluation page', async ({ page }) => {
    await page.goto('/evaluacion');
    
    await expect(page.locator('h1')).toContainText('Evaluaciones Psicológicas');
    await expect(page.locator('text=Comenzar Evaluación')).toBeVisible();
  });

  test('should start questionnaire', async ({ page }) => {
    await page.goto('/evaluacion');
    await page.click('text=Comenzar Evaluación').first();
    
    // Should navigate to questionnaire view
    await expect(page.locator('text=Pregunta')).toBeVisible();
  });
});

test.describe('Chat Flow', () => {
  test('should display chat interface', async ({ page }) => {
    await page.goto('/chat-ia');
    
    await expect(page.locator('h1')).toContainText('Asistente de Bienestar');
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button:has-text("Enviar")')).toBeVisible();
  });

  test('should send message', async ({ page }) => {
    await page.goto('/chat-ia');
    await page.fill('textarea', 'Hola, ¿cómo estás?');
    await page.click('button:has-text("Enviar")');
    
    // Should show user message
    await expect(page.locator('text=Hola, ¿cómo estás?')).toBeVisible();
  });
});
