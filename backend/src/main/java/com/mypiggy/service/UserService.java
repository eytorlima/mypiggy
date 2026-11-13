package com.mypiggy.service;

import com.mypiggy.dto.UpdateProfileRequestDTO;
import com.mypiggy.dto.UserProfileResponseDTO;
import com.mypiggy.exception.ResourceNotFoundException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.User;
import com.mypiggy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Atualiza nome e/ou senha. Nome e senha são alterados na mesma transação:
    // se a validação da senha falhar, o nome também não é salvo.
    @Transactional
    public UserProfileResponseDTO updateProfile(UUID userId, UpdateProfileRequestDTO request) {

        // Busca de novo no banco: o User do @AuthenticationPrincipal pode estar desatualizado
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        boolean changeName = request.getName() != null;
        boolean changePassword = request.getNewPassword() != null && !request.getNewPassword().isBlank();

        if (!changeName && !changePassword) {
            throw new ValidationException("Informe o nome ou a nova senha");
        }

        if (changeName) {
            String name = request.getName().trim();
            if (name.isEmpty()) {
                throw new ValidationException("Nome não pode ser vazio");
            }
            user.setName(name);
        }

        if (changePassword) {
            String currentPassword = request.getCurrentPassword();

            if (currentPassword == null || currentPassword.isBlank()) {
                throw new ValidationException("Informe a senha atual");
            }

            // 400 (e não 401): o interceptor do front trata 401 como sessão expirada e deslogaria o usuário
            if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                throw new ValidationException("Senha atual incorreta");
            }

            if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
                throw new ValidationException("A nova senha deve ser diferente da atual");
            }

            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);

        return new UserProfileResponseDTO(saved.getId(), saved.getName(), saved.getEmail());
    }
}