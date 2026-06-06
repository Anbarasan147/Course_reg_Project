package com.coursereg.system;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CourseRegSystemApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void printHash() {
		System.out.println("BCRYPT_HASH_START: " + new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("password") + " :BCRYPT_HASH_END");
	}
}
