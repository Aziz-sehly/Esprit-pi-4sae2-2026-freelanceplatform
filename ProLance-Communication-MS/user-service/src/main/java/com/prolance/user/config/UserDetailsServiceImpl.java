package com.prolance.user.config;

import com.prolance.user.domain.User;
import com.prolance.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable : " + email));
        return org.springframework.security.core.userdetails.User.builder()
                .username(u.getEmail())
                .password(u.encodedPassword())
                .disabled(!Boolean.TRUE.equals(u.getIsActive()))
                .authorities(u.springAuthorities())
                .build();
    }
}
