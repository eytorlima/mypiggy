package com.mypiggy.service;

import com.mypiggy.dto.AuthResponseDTO;
import com.mypiggy.dto.LoginRequestDTO;
import com.mypiggy.dto.RegisterRequestDTO;
import com.mypiggy.exception.UnauthorizedException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.User;
import com.mypiggy.repository.UserRepository;
import com.mypiggy.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PiggyBankService piggyBankService;
    private final UserSettingsService userSettingsService;

    // @Transactional: usuário, reserva de emergência e configurações são salvos juntos.
    // Se qualquer um falhar, o cadastro inteiro é desfeito
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        
        if (userRepository.existsByEmail(request.getEmail())){
            throw new ValidationException("Email já cadastrado");
        }

        if (userRepository.existsByCpf(request.getCpf())){
            throw new ValidationException("CPF já cadastrado");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setCpf(request.getCpf());
        user.setPhone(request.getPhone());
        user.setBirthDate(request.getBirthDate());

        User savedUser = userRepository.save(user);

        // Todo usuário nasce com uma Reserva de emergência
        piggyBankService.createEmergencyFor(savedUser);

        // Todo usuário nasce com as configurações padrão (BRL, pt-BR, horário de Brasília)
        userSettingsService.createDefaultFor(savedUser);

        String token = jwtService.generateToken(savedUser.getEmail());

        return new AuthResponseDTO(
            token,
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail()
        );
    }

    public AuthResponseDTO login(LoginRequestDTO request) {

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("Email ou senha inválidos"));
        
        if(!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email ou senha inválidos");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponseDTO(
            token, 
            user.getId(),
            user.getName(),
            user.getEmail()
        );
    }

}