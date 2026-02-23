package com.bpr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * BPR (Builder Process Repo) 메인 진입점
 * Java 21 Virtual Threads 기반으로 동작
 */
@SpringBootApplication
public class BprApplication {

    public static void main(String[] args) {
        SpringApplication.run(BprApplication.class, args);
    }
}
