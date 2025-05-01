package kr.easylab.learning_assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class LearningAssistantApplication {

	public static void main(String[] args) {
		SpringApplication.run(LearningAssistantApplication.class, args);
	}

}
